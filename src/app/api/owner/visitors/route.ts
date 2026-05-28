import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Visitor from '@/lib/db/models/Visitor'
import { verifySession } from '@/lib/auth/verifySession'

export async function GET(request: NextRequest): Promise<Response> {
  const session = await verifySession(request)

  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl

  const rawPage = searchParams.get('page') ?? '1'
  const rawLimit = searchParams.get('limit') ?? '50'

  const pageNum = Number(rawPage)
  const limitNum = Number(rawLimit)

  if (
    !Number.isInteger(pageNum) ||
    !Number.isInteger(limitNum) ||
    pageNum < 1 ||
    limitNum < 1 ||
    limitNum > 200
  ) {
    return Response.json({ error: 'invalid_params' }, { status: 400 })
  }

  try {
    await connectDB()

    const [visitors, total] = await Promise.all([
      Visitor.find(
        {},
        { _id: 0, visitorId: 1, enrolledAt: 1, dailyRequests: 1, dailyTokens: 1, lastResetAt: 1 },
      )
        .sort({ enrolledAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Visitor.countDocuments(),
    ])

    return Response.json({
      visitors,
      total,
      page: pageNum,
      limit: limitNum,
    })
  } catch (error: unknown) {
    console.error('[GET /api/owner/visitors]', error)
    return Response.json({ error: 'internal_server_error' }, { status: 500 })
  }
}
