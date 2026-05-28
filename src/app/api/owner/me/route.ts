import { NextRequest } from 'next/server'
import { verifySession } from '@/lib/auth/verifySession'

export async function GET(request: NextRequest): Promise<Response> {
  const session = await verifySession(request)

  if (!session) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  return Response.json({ role: session.role ?? 'admin' })
}
