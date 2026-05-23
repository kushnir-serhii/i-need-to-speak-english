import { NextRequest } from 'next/server'
import { getOpenAIClient } from '@/lib/openai'
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/systemPrompt'

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

    const { messages, visitorId } = body as Record<string, unknown>

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

    const openai = getOpenAIClient()
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      stream: true,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: DEFAULT_SYSTEM_PROMPT },
        ...typedMessages,
      ],
    })

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? ''
            if (delta) {
              controller.enqueue(encoder.encode(delta))
            }
          }
          controller.close()
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
