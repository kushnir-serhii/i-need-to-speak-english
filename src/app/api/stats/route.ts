import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Visitor from '@/lib/db/models/Visitor'
import { resetIfNeeded } from '@/lib/db/resetIfNeeded'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await connectDB()

    const visitorId = request.nextUrl.searchParams.get('visitorId')

    if (!visitorId) {
      return NextResponse.json({ error: 'missing_visitor_id' }, { status: 400 })
    }

    const capEnv = process.env.DAILY_VISITOR_CAP
    const parsedCap = parseInt(capEnv ?? '', 10)
    const cap = Number.isFinite(parsedCap) ? parsedCap : 100

    const limitEnv = process.env.DAILY_REQUEST_LIMIT
    const parsedLimit = parseInt(limitEnv ?? '', 10)
    const dailyRequestLimit = Number.isFinite(parsedLimit) ? parsedLimit : 20

    const now = new Date()
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    )

    const count = await Visitor.countDocuments({ enrolledAt: { $gte: startOfToday } })

    const visitor = await Visitor.findOne({ visitorId })

    if (!visitor) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }

    const freshVisitor = await resetIfNeeded(visitor)

    return NextResponse.json(
      {
        count,
        cap,
        dailyRequests: freshVisitor.dailyRequests,
        dailyRequestLimit,
        dailyTokens: freshVisitor.dailyTokens,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('[GET /api/stats]', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
