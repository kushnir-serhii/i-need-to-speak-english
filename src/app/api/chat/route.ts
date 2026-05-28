import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { getOpenAIClient } from '@/lib/openai'
import { buildSystemPrompt } from '@/lib/systemPrompt'
import { connectDB } from '@/lib/mongodb'
import Visitor from '@/lib/db/models/Visitor'
import { resetIfNeeded } from '@/lib/db/resetIfNeeded'
import { verifySession } from '@/lib/auth/verifySession'

const BYO_KEY_PATTERN = /^sk-[A-Za-z0-9\-_]{20,}$/

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function jsonError(
  status: number,
  error: string,
  message: string,
): Response {
  return new Response(JSON.stringify({ error, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError(400, 'invalid_request', 'Invalid JSON body')
    }

    if (
      typeof body !== 'object' ||
      body === null
    ) {
      return jsonError(400, 'invalid_request', 'messages array and visitorId are required')
    }

    const { messages, visitorId, targetLanguage } = body as Record<string, unknown>

    if (!Array.isArray(messages) || typeof visitorId !== 'string' || !visitorId.trim()) {
      return jsonError(400, 'invalid_request', 'messages array and visitorId are required')
    }

    const validRoles = new Set(['user', 'assistant'])
    for (const msg of messages) {
      if (
        typeof msg !== 'object' ||
        msg === null ||
        !validRoles.has((msg as Record<string, unknown>).role as string) ||
        typeof (msg as Record<string, unknown>).content !== 'string' ||
        !((msg as Record<string, unknown>).content as string).trim()
      ) {
        return jsonError(400, 'invalid_request', 'Each message must have a valid role and non-empty content')
      }
    }

    const typedMessages = messages as ChatMessage[]

    if (typedMessages.length > 0) {
      const lastContent = typedMessages[typedMessages.length - 1].content
      if (lastContent.length > 1000) {
        return jsonError(400, 'message_too_long', 'Message exceeds 1000 characters')
      }
    }

    const { apiKey } = body as Record<string, unknown>

    // BYO key validation
    let byoKey: string | null = null
    if (apiKey !== undefined && apiKey !== null && apiKey !== '') {
      if (typeof apiKey !== 'string' || !BYO_KEY_PATTERN.test(apiKey)) {
        return jsonError(400, 'invalid_api_key_format', 'API key format is invalid')
      }
      byoKey = apiKey
    }

    const adminSession = await verifySession(request)
    const isAdmin = adminSession?.role === 'admin'

    if (!isAdmin) {
      await connectDB()
      const visitor = await Visitor.findOne({ visitorId })
      if (!visitor) {
        return jsonError(404, 'not_found', 'Visitor not found')
      }

      const freshVisitor = await resetIfNeeded(visitor)

      // Only enforce daily limits in Free mode (no BYO key)
      if (!byoKey) {
        const limitEnv = process.env.DAILY_REQUEST_LIMIT
        const parsedLimit = parseInt(limitEnv ?? '', 10)
        const dailyRequestLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20

        if (freshVisitor.dailyRequests >= dailyRequestLimit) {
          return new Response(
            JSON.stringify({
              error: 'daily_limit_exceeded',
              dailyRequests: freshVisitor.dailyRequests,
              dailyRequestLimit,
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Admins always use the default client (no limits); non-admins use BYO or default
    const openai = (!isAdmin && byoKey) ? new OpenAI({ apiKey: byoKey }) : getOpenAIClient()

    let stream: Awaited<ReturnType<typeof openai.chat.completions.create>>
    try {
      stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: 1024,
        messages: [
          { role: 'system', content: buildSystemPrompt(typeof targetLanguage === 'string' && targetLanguage.trim() ? targetLanguage : 'English') },
          ...typedMessages,
        ],
      })
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        (err as Record<string, unknown>).status === 401
      ) {
        return jsonError(401, 'invalid_api_key', 'The provided API key is invalid')
      }
      throw err
    }

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let totalTokens = 0
          let inputTokens = 0
          let outputTokens = 0

          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              controller.enqueue(encoder.encode(delta))
            }
            // Capture usage from the final chunk (sent by OpenAI when include_usage: true)
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? 0
              outputTokens = chunk.usage.completion_tokens ?? 0
              totalTokens = chunk.usage.total_tokens ?? 0
            }
          }

          // Append USAGE sentinel before closing
          const sentinel = `\n\x00USAGE:${JSON.stringify({ inputTokens, outputTokens, totalTokens })}`
          controller.enqueue(encoder.encode(sentinel))
          controller.close()

          // Fire-and-forget counter increment (do not await)
          // For admins, only increment if a visitorId was provided
          if (visitorId) {
            Visitor.findOneAndUpdate(
              { visitorId },
              { $inc: { dailyRequests: 1, dailyTokens: totalTokens } }
            ).catch(console.error)
          }
        } catch (err: unknown) {
          controller.error(err)
        }
      },
    })

    return new Response(readableStream, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof (err as Record<string, unknown>).status === 'number'
    ) {
      return jsonError(502, 'upstream_error', 'Something went wrong. Please try again.')
    }
    return jsonError(500, 'server_error', 'Something went wrong. Please try again.')
  }
}
