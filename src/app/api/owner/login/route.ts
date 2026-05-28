import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { connectDB } from '@/lib/mongodb'
import Admin from '@/lib/db/models/Admin'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me')

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { username, password } = body as Record<string, unknown>

  if (typeof username !== 'string' || typeof password !== 'string') {
    return Response.json({ error: 'username and password are required' }, { status: 400 })
  }

  await connectDB()

  const admin = await Admin.findOne({ username: username.trim() })
  if (!admin) {
    return Response.json({ error: 'invalid_credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, admin.passwordHash)
  if (!valid) {
    return Response.json({ error: 'invalid_credentials' }, { status: 401 })
  }

  const token = await new SignJWT({ sub: admin.username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

  const response = Response.json({ ok: true, role: 'admin' })

  // Set HTTP-only session cookie
  const headers = new Headers(response.headers)
  headers.set(
    'Set-Cookie',
    `intse-session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
  )

  return new Response(response.body, { status: 200, headers })
}
