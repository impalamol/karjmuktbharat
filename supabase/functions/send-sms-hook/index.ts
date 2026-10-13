// Supabase Auth "Send SMS" hook. Enforces OTP rate limit: max 3 OTPs per mobile per 10 minutes
// (and 10 per IP per 10 minutes), then delivers the OTP through MSG91.
// Auth calls this server-to-server, so the limit cannot be bypassed from the client.
import { admin } from '../_shared/auth.ts'
import { hmacSha256, safeEqual, toHex, b64, unb64 } from '../_shared/crypto.ts'

const HOOK_SECRET = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '').replace('v1,whsec_', '')
const HASH_SECRET = Deno.env.get('OTP_HASH_SECRET') ?? ''
const MSG91_KEY = Deno.env.get('MSG91_AUTH_KEY') ?? ''
const MSG91_TEMPLATE = Deno.env.get('MSG91_OTP_TEMPLATE_ID') ?? ''
const PER_MOBILE = 3
const PER_IP = 10
const WINDOW_MS = 10 * 60 * 1000

function hookError(status: number, message: string) {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Standard Webhooks signature: base64(HMAC_SHA256(secret, `${id}.${timestamp}.${body}`))
async function verify(req: Request, raw: string): Promise<boolean> {
  const id = req.headers.get('webhook-id') ?? ''
  const ts = req.headers.get('webhook-timestamp') ?? ''
  const sigs = (req.headers.get('webhook-signature') ?? '').split(' ')
  if (!id || !ts || !HOOK_SECRET) return false
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false
  const expected = b64(await hmacSha256(unb64(HOOK_SECRET), `${id}.${ts}.${raw}`))
  return sigs.some((s) => safeEqual(s.replace(/^v1,/, ''), expected))
}

Deno.serve(async (req) => {
  const raw = await req.text()
  if (!(await verify(req, raw))) return hookError(401, 'invalid signature')

  const { user, sms } = JSON.parse(raw) as { user: { phone: string }; sms: { otp: string } }
  const phone = user.phone.replace(/^\+/, '')
  const mobileHash = toHex(await hmacSha256(HASH_SECRET, phone))
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const { count: mobileCount } = await admin
    .from('otp_requests')
    .select('id', { count: 'exact', head: true })
    .eq('mobile_hash', mobileHash)
    .gte('created_at', since)
  if ((mobileCount ?? 0) >= PER_MOBILE) return hookError(429, 'Too many OTP requests. Try again in 10 minutes.')

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  if (ip) {
    const { count: ipCount } = await admin
      .from('otp_requests')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since)
    if ((ipCount ?? 0) >= PER_IP) return hookError(429, 'Too many OTP requests from this network.')
  }

  await admin.from('otp_requests').insert({ mobile_hash: mobileHash, ip })

  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { authkey: MSG91_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_id: MSG91_TEMPLATE, mobile: phone, otp: sms.otp }),
  })
  if (!res.ok) return hookError(502, 'Could not send OTP')
  return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } })
})
