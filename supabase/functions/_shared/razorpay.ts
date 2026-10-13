// Minimal Razorpay / RazorpayX REST client (test mode keys in non-production).
import { HttpError } from './http.ts'

const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''
export const RAZORPAYX_ACCOUNT = Deno.env.get('RAZORPAYX_ACCOUNT_NUMBER') ?? ''

export async function rzp<T>(path: string, body: unknown, idempotencyKey?: string): Promise<T> {
  if (!KEY_ID || !KEY_SECRET) throw new HttpError(500, 'Razorpay not configured', 'config')
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'X-Payout-Idempotency': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('razorpay error', path, res.status, data?.error?.code)
    throw new HttpError(502, data?.error?.description ?? 'Payment provider error', 'provider_error')
  }
  return data as T
}

export interface Payout {
  id: string
  status: 'queued' | 'pending' | 'processing' | 'processed' | 'reversed' | 'cancelled' | 'rejected' | 'failed'
  utr: string | null
}

/**
 * Pays directly into the borrower's bank LOAN account (never a wallet).
 * Creates contact + fund account each time; Razorpay de-duplicates identical fund accounts.
 */
export async function payToLoanAccount(opts: {
  referenceId: string
  name: string
  ifsc: string
  accountNumber: string
  amountRupees: number
  purpose: 'payout' | 'refund'
  narration: string
}): Promise<Payout> {
  const contact = await rzp<{ id: string }>('/contacts', { name: opts.name, type: 'customer', reference_id: opts.referenceId.slice(0, 40) })
  const fa = await rzp<{ id: string }>('/fund_accounts', {
    contact_id: contact.id,
    account_type: 'bank_account',
    bank_account: { name: opts.name, ifsc: opts.ifsc, account_number: opts.accountNumber },
  })
  return rzp<Payout>(
    '/payouts',
    {
      account_number: RAZORPAYX_ACCOUNT,
      fund_account_id: fa.id,
      amount: opts.amountRupees * 100,
      currency: 'INR',
      mode: 'NEFT',
      purpose: opts.purpose,
      queue_if_low_balance: true,
      reference_id: opts.referenceId.slice(0, 40),
      narration: opts.narration.slice(0, 30),
    },
    opts.referenceId,
  )
}
