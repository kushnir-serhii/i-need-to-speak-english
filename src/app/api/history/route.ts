import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ChatSession from '@/lib/db/models/ChatSession'

export async function GET(request: NextRequest): Promise<Response> {
  const visitorId = request.nextUrl.searchParams.get('visitorId')
  if (!visitorId?.trim()) {
    return Response.json({ error: 'missing_visitor_id' }, { status: 400 })
  }

  await connectDB()

  const sessions = await ChatSession.aggregate([
    { $match: { visitorId } },
    { $sort: { updatedAt: -1 } },
    { $limit: 50 },
    {
      $project: {
        _id: 0,
        sessionId: 1,
        createdAt: 1,
        updatedAt: 1,
        messageCount: { $size: '$messages' },
        preview: {
          $substr: [
            { $ifNull: [{ $arrayElemAt: ['$messages.content', 0] }, ''] },
            0,
            100,
          ],
        },
      },
    },
  ])

  return Response.json({ sessions })
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { sessionId, visitorId, messages } = body as Record<string, unknown>

  if (
    typeof sessionId !== 'string' || !sessionId.trim() ||
    typeof visitorId !== 'string' || !visitorId.trim() ||
    !Array.isArray(messages)
  ) {
    return Response.json({ error: 'invalid_request' }, { status: 400 })
  }

  await connectDB()

  await ChatSession.findOneAndUpdate(
    { sessionId },
    { $set: { visitorId, messages } },
    { upsert: true, new: true },
  )

  return Response.json({ ok: true })
}

export async function DELETE(request: NextRequest): Promise<Response> {
  const visitorId = request.nextUrl.searchParams.get('visitorId')
  if (!visitorId?.trim()) {
    return Response.json({ error: 'missing_visitor_id' }, { status: 400 })
  }

  try {
    await connectDB()
    const result = await ChatSession.deleteMany({ visitorId })
    return Response.json({ ok: true, deleted: result.deletedCount })
  } catch {
    return Response.json({ error: 'server_error' }, { status: 500 })
  }
}
