export async function POST(): Promise<Response> {
  const response = Response.json({ ok: true })
  const headers = new Headers(response.headers)
  headers.set('Set-Cookie', 'intse-session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
  return new Response(response.body, { status: 200, headers })
}
