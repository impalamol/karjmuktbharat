// Shared helpers for the httpOnly refresh-token cookie (Vercel Edge runtime).
export const COOKIE = '__Host-kmb_rt'
const MAX_AGE = 60 * 60 * 24 * 30

export function readCookie(req: Request): string | null {
  const raw = req.headers.get('cookie') ?? ''
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === COOKIE) return decodeURIComponent(v.join('='))
  }
  return null
}

export function setCookie(value: string): string {
  return `${COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`
}

export function clearCookie(): string {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
}

/** CSRF defence: only same-origin browser requests may touch the cookie. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  return origin === new URL(req.url).origin
}

export function reply(body: unknown, status = 200, cookie?: string): Response {
  const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
  if (cookie) headers.append('Set-Cookie', cookie)
  return new Response(JSON.stringify(body), { status, headers })
}
