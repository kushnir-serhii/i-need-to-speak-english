import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Visitor from '@/lib/db/models/Visitor'
import { verifySession } from '@/lib/auth/verifySession'

export async function GET(request: NextRequest): Promise<Response> {
  const session = await verifySession(request)

  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  await connectDB()

  const todayUTC = new Date()
  todayUTC.setUTCHours(0, 0, 0, 0)

  const [aggregate, topVisitors] = await Promise.all([
    Visitor.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          today: [
            { $match: { lastResetAt: { $gte: todayUTC } } },
            {
              $group: {
                _id: null,
                visitors: { $sum: 1 },
                messages: { $sum: '$dailyRequests' },
                tokens: { $sum: '$dailyTokens' },
              },
            },
          ],
        },
      },
    ]),
    Visitor.find(
      { lastResetAt: { $gte: todayUTC }, dailyRequests: { $gt: 0 } },
      { visitorId: 1, dailyRequests: 1, dailyTokens: 1, _id: 0 },
    )
      .sort({ dailyRequests: -1 })
      .limit(10)
      .lean(),
  ])

  const totalVisitors: number = aggregate[0]?.total[0]?.count ?? 0
  const todayData = aggregate[0]?.today[0]
  const todayVisitors: number = todayData?.visitors ?? 0
  const todayMessages: number = todayData?.messages ?? 0
  const todayTokens: number = todayData?.tokens ?? 0

  const chartData = topVisitors.map((v) => ({
    label: v.visitorId.slice(-8),
    messages: v.dailyRequests,
    tokens: v.dailyTokens,
  }))

  return Response.json({
    totalVisitors,
    todayVisitors,
    todayMessages,
    todayTokens,
    chartData,
  })
}
