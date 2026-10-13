// POST -> exchanges the httpOnly refresh cookie for a fresh session (rotated), returned to memory only.
import { clearCookie, readCookie, reply, sameOrigin, setCookie } from './_cookie'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)
  if (!sameOrigin(req)) return reply({ error: 'forbidden' }, 403)

  const refreshToken = readCookie(req)
  if (!refreshToken) return reply({ session: null })

  const res = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: process.env.SUPABASE_ANON_KEY ?? '', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) return reply({ session: null }, 200, clearCookie())

  const session = (await res.json()) as { refresh_token: string }
  return reply({ session }, 200, setCookie(session.refresh_token))
}
