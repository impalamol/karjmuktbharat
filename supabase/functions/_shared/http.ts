// Shared HTTP helpers for Edge Functions.
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://karjmuktbharat.com,https://www.karjmuktbharat.com')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]!
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public code = 'error') {
    super(message)
  }
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = fwd || req.headers.get('x-real-ip') || req.headers.get('cf-connecting-ip')
  return ip && /^[0-9a-fA-F:.]{3,45}$/.test(ip) ? ip : null
}

/** Wrap a handler with CORS preflight, method check and uniform error responses (no stack traces leak). */
export function serve(methods: string[], handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
    if (!methods.includes(req.method)) return json(req, { error: 'method_not_allowed' }, 405)
    try {
      return await handler(req)
    } catch (err) {
      if (err instanceof HttpError) return json(req, { error: err.code, message: err.message }, err.status)
      if (err && typeof err === 'object' && 'issues' in err) {
        return json(req, { error: 'validation_failed', issues: (err as { issues: unknown }).issues }, 422)
      }
      console.error('unhandled', err)
      return json(req, { error: 'internal_error', message: 'Something went wrong' }, 500)
    }
  })
}

export async function readJson(req: Request, maxBytes = 16_384): Promise<unknown> {
  const len = Number(req.headers.get('content-length') ?? '0')
  if (len > maxBytes) throw new HttpError(413, 'Payload too large', 'payload_too_large')
  const text = await req.text()
  if (text.length > maxBytes) throw new HttpError(413, 'Payload too large', 'payload_too_large')
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'Invalid JSON', 'bad_json')
  }
}
