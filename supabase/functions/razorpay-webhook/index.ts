// Razorpay webhook: verifies X-Razorpay-Signature, then updates payouts (UTR) and mandates.
// Deploy with --no-verify-jwt; authenticity comes from the HMAC signature.
import { admin } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { hmacSha256, safeEqual, toHex } from '../_shared/crypto.ts'

const SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
  const raw = await req.text()
  if (raw.length > 256_000) return new Response('too large', { status: 413 })
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  if (!SECRET || !safeEqual(toHex(await hmacSha256(SECRET, raw)), sig)) {
    return new Response('invalid signature', { status: 401 })
  }

  const evt = JSON.parse(raw) as { event: string; payload: Record<string, { entity: Record<string, unknown> }> }
  const eventId = req.headers.get('x-razorpay-event-id') ?? ''

  if (evt.event.startsWith('payout.')) {
    const p = evt.payload.payout?.entity as { id: string; reference_id?: string; utr?: string; status: string } | undefined
    if (!p) return new Response('ok')
    const status = ({ 'payout.processed': 'success', 'payout.reversed': 'reversed', 'payout.failed': 'failed', 'payout.rejected': 'failed' } as Record<string, string>)[evt.event]
    if (!status) return new Response('ok')
    const { data: txn } = await admin
      .from('transactions')
      .update({ status, utr_no: p.utr ?? null, provider_payout_id: p.id })
      .or(`provider_payout_id.eq.${p.id},provider_ref.eq.${p.reference_id ?? '-'}`)
      .select('id, type, loan_id')
      .maybeSingle()
    if (txn?.type === 'rescue_payout' && status === 'success') {
      await admin.from('rescue_cases').update({ is_saved: true, saved_at: new Date().toISOString() }).eq('loan_id', txn.loan_id).eq('is_saved', false)
    }
    await audit(req, null, `webhook.${evt.event}`, { event_id: eventId, payout_id: p.id, txn_id: txn?.id ?? null })
  }

  if (evt.event === 'token.confirmed' || evt.event === 'token.rejected' || evt.event === 'payment.authorized') {
    const pay = evt.payload.payment?.entity as { order_id?: string; token_id?: string } | undefined
    const tok = evt.payload.token?.entity as { id?: string } | undefined
    const orderId = pay?.order_id
    if (orderId) {
      await admin
        .from('mandates')
        .update({
          status: evt.event === 'token.rejected' ? 'rejected' : evt.event === 'token.confirmed' ? 'confirmed' : 'authorized',
          razorpay_token_id: tok?.id ?? pay?.token_id ?? null,
        })
        .eq('razorpay_order_id', orderId)
    }
    await audit(req, null, `webhook.${evt.event}`, { event_id: eventId, order_id: orderId ?? null })
  }

  return new Response('ok')
})
