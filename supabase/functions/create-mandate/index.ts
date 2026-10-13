// Razorpay eMandate (test mode) registration for the monthly borrower contribution.
import { z } from 'npm:zod@3'
import { admin, requireUser } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { BLOCK_RULES } from '../_shared/calculations.ts'
import { HttpError, json, readJson, serve } from '../_shared/http.ts'
import { rzp } from '../_shared/razorpay.ts'

const body = z.object({ loanId: z.string().uuid() }).strict()

serve(['POST'], async (req) => {
  const { user } = await requireUser(req)
  const { loanId } = body.parse(await readJson(req))

  const { data: loan } = await admin
    .from('loans')
    .select('id, user_id, loan_type, verification_status, profiles!loans_user_id_fkey(full_name, mobile)')
    .eq('id', loanId)
    .single()
  if (!loan || loan.user_id !== user.id) throw new HttpError(404, 'Loan not found', 'not_found')
  if (loan.verification_status !== 'verified') throw new HttpError(409, 'Loan must be verified first', 'not_verified')

  const rule = BLOCK_RULES[loan.loan_type as 'education' | 'home']
  const monthly = rule.borrowerPool / rule.blockSize
  const maxAmount = monthly * 2 // headroom; the actual debit is always the monthly contribution
  const profile = loan.profiles as { full_name?: string; mobile?: string } | null

  const customer = await rzp<{ id: string }>('/customers', {
    name: profile?.full_name ?? 'KarjMukt Member',
    contact: profile?.mobile ?? undefined,
    fail_existing: '0',
  })
  const order = await rzp<{ id: string }>('/orders', {
    amount: 0,
    currency: 'INR',
    method: 'emandate',
    customer_id: customer.id,
    receipt: `mandate-${loan.id}`.slice(0, 40),
    payment_capture: 1,
    token: {
      auth_type: 'netbanking',
      max_amount: maxAmount * 100,
      expire_at: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 3600,
      frequency: 'monthly',
    },
    notes: { loan_id: loan.id, user_id: user.id },
  })

  const { error } = await admin.from('mandates').insert({
    user_id: user.id,
    loan_id: loan.id,
    razorpay_customer_id: customer.id,
    razorpay_order_id: order.id,
    max_amount: maxAmount,
    status: 'created',
  })
  if (error) throw new HttpError(500, 'Could not save mandate', 'db_error')
  await audit(req, user.id, 'mandate.created', { loan_id: loan.id, order_id: order.id, max_amount: maxAmount })
  return json(req, { orderId: order.id, customerId: customer.id, monthly, maxAmount })
})
