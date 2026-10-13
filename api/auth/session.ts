// POST   { refresh_token } -> stores it in an httpOnly cookie (never readable by JS).
// DELETE                   -> signs out: clears cookie and revokes the session.
import { clearCookie, readCookie, reply, sameOrigin, setCookie } from './_cookie'

export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  if (!sameOrigin(req)) return reply({ error: 'forbidden' }, 403)

  if (req.method === 'POST') {
    const body = (await req.json().catch(() => null)) as { refresh_token?: unknown } | null
    const token = body?.refresh_token
    if (typeof token !== 'string' || token.length < 8 || token.length > 512 || !/^[\w.-]+$/.test(token)) {
      return reply({ error: 'bad_request' }, 400)
    }
    return reply({ ok: true }, 200, setCookie(token))
  }

  if (req.method === 'DELETE') {
    const access = req.headers.get('authorization')
    if (access && readCookie(req)) {
      await fetch(`${process.env.SUPABASE_URL}/auth/v1/logout?scope=local`, {
        method: 'POST',
        headers: { apikey: process.env.SUPABASE_ANON_KEY ?? '', Authorization: access },
      }).catch(() => undefined)
    }
    return reply({ ok: true }, 200, clearCookie())
  }

  return reply({ error: 'method_not_allowed' }, 405)
}
