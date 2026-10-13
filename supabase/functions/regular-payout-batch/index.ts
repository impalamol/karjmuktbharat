// Monthly REGULAR credit (Rs 3,200 education / Rs 4,400 home) for one block, in batches of 25.
// Idempotent per loan per month via provider_ref = regular-<loan>-<YYYY-MM>.
// Call repeatedly with the returned nextSeat until done = true.
import { z } from 'npm:zod@3'
import { admin, requireAal2, requireAdmin } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { calculateRegularPerUser } from '../_shared/calculations.ts'
import { decryptField } from '../_shared/crypto.ts'
import { HttpError, json, readJson, serve } from '../_shared/http.ts'
import { payToLoanAccount } from '../_shared/razorpay.ts'

const BATCH = 25
const body = z
  .object({
    loanType: z.enum(['education', 'home']),
    blockNumber: z.number().int().positive(),
    month: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/),
    afterSeat: z.number().int().min(0).max(1000).default(0),
  })
  .strict()

serve(['POST'], async (req) => {
  const caller = await requireAdmin(req)
  requireAal2(caller)
  const input = body.parse(await readJson(req))
  const amount = calculateRegularPerUser(input.loanType)

  const { data: pool } = await admin.from('pools').select('total_users').eq('type', input.loanType).eq('block_number', input.blockNumber).single()
  if (!pool) throw new HttpError(404, 'Block not found', 'not_found')

  const { data: loans, error } = await admin
    .from('loans')
    .select('id, user_id, ifsc, loan_account_encrypted, seat_number, profiles!loans_user_id_fkey(full_name)')
    .eq('loan_type', input.loanType)
    .eq('block_number', input.blockNumber)
    .eq('verification_status', 'verified')
    .gt('seat_number', input.afterSeat)
    .order('seat_number')
    .limit(BATCH)
  if (error) throw new HttpError(500, 'Could not load block', 'db_error')

  if (input.afterSeat === 0) {
    await audit(req, caller.user.id, 'admin.regular_payout.started', { ...input, amount, users: pool.total_users })
  }

  const results: { seat: number; status: string }[] = []
  for (const loan of loans ?? []) {
    const ref = `regular-${loan.id}-${input.month}`
    const { data: txn, error: tErr } = await admin
      .from('transactions')
      .insert({ user_id: loan.user_id, loan_id: loan.id, type: 'regular_credit', amount, status: 'initiated', provider_ref: ref, block_number: input.blockNumber })
      .select('id')
      .single()
    if (tErr) {
      results.push({ seat: loan.seat_number!, status: 'already_paid' })
      continue
    }
    try {
      const payout = await payToLoanAccount({
        referenceId: ref,
        name: (loan.profiles as { full_name?: string } | null)?.full_name ?? 'KarjMukt Member',
        ifsc: loan.ifsc,
        accountNumber: await decryptField(loan.loan_account_encrypted, `loan:${loan.id}`),
        amountRupees: amount,
        purpose: 'payout',
        narration: `KarjMukt ${input.month}`,
      })
      await admin
        .from('transactions')
        .update({ status: payout.status === 'processed' ? 'success' : 'processing', utr_no: payout.utr ?? null, provider_payout_id: payout.id })
        .eq('id', txn.id)
      results.push({ seat: loan.seat_number!, status: payout.status })
    } catch {
      await admin.from('transactions').update({ status: 'failed' }).eq('id', txn.id)
      results.push({ seat: loan.seat_number!, status: 'failed' })
    }
  }

  const last = loans?.at(-1)?.seat_number ?? input.afterSeat
  const done = (loans?.length ?? 0) < BATCH
  await audit(req, caller.user.id, 'admin.regular_payout.batch', { ...input, processed: results.length, failed: results.filter((r) => r.status === 'failed').length })
  return json(req, { amount, results, nextSeat: last, done })
})
