import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import Admin from '@/lib/db/models/Admin'

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { secret, username, password } = body as Record<string, unknown>

  if (!process.env.OWNER_SEED_SECRET) {
    return Response.json({ error: 'seed_not_configured' }, { status: 503 })
  }

  if (secret !== process.env.OWNER_SEED_SECRET) {
    return Response.json({ error: 'forbidden' }, { status: 403 })
  }

  if (
    typeof username !== 'string' || !username.trim() ||
    typeof password !== 'string' || password.length < 8
  ) {
    return Response.json({ error: 'username and password (min 8 chars) are required' }, { status: 400 })
  }

  await connectDB()

  const existing = await Admin.countDocuments()
  if (existing > 0) {
    return Response.json({ error: 'already_seeded' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await Admin.create({ username: username.trim(), passwordHash, role: 'admin' })

  return Response.json({ ok: true, username: username.trim(), role: 'admin' })
}
