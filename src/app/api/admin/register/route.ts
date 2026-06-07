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

  if (
    typeof username !== 'string' || !username.trim() ||
    typeof password !== 'string' || password.length < 8
  ) {
    return Response.json(
      { error: 'username and password (min 8 chars) are required' },
      { status: 400 },
    )
  }

  try {
    await connectDB()

    const existing = await Admin.findOne({ username: username.trim() })
    if (existing) {
      return Response.json({ error: 'username_taken' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const admin = await Admin.create({ username: username.trim(), passwordHash, role: 'user' })

    const token = await new SignJWT({ sub: admin.username, role: admin.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET)

    const response = Response.json({ ok: true, role: admin.role })

    const headers = new Headers(response.headers)
    headers.set(
      'Set-Cookie',
      `intse-session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    )

    return new Response(response.body, { status: 201, headers })
  } catch (err) {
    console.error('[register] error:', err)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
