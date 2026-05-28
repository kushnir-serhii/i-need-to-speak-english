import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export interface SessionPayload {
  sub: string
  role: string
  iat: number
  exp: number
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me')

export async function verifySession(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get('intse-session')?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
