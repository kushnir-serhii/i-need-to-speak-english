import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import ChatSession from '@/lib/db/models/ChatSession'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const { sessionId } = await params
  const visitorId = request.nextUrl.searchParams.get('visitorId')

  if (!visitorId?.trim()) {
    return Response.json({ error: 'missing_visitor_id' }, { status: 400 })
  }

  await connectDB()

  const session = await ChatSession.findOne({ sessionId, visitorId }, { _id: 0, __v: 0 }).lean()

  if (!session) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  return Response.json({ session })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const { sessionId } = await params
  const visitorId = request.nextUrl.searchParams.get('visitorId')

  if (!visitorId?.trim()) {
    return Response.json({ error: 'missing_visitor_id' }, { status: 400 })
  }

  await connectDB()

  const result = await ChatSession.deleteOne({ sessionId, visitorId })

  if (result.deletedCount === 0) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  return Response.json({ ok: true })
}
