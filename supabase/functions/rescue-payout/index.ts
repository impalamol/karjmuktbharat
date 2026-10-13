// Admin triggers a rescue payout straight into the borrower's bank loan account.
// Decrypts the account number in memory only; UTR arrives via payout response / webhook.
import { admin, requireAal2, requireAdmin } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { decryptField } from '../_shared/crypto.ts'
import { HttpError, json, readJson, serve } from '../_shared/http.ts'
import { payToLoanAccount } from '../_shared/razorpay.ts'
import { uuidBody } from '../_shared/validation.ts'

serve(['POST'], async (req) => {
  const caller = await requireAdmin(req)
  requireAal2(caller)
  const { rescueCaseId } = uuidBody('rescueCaseId').parse(await readJson(req)) as { rescueCaseId: string }

  const { data: rc } = await admin
    .from('rescue_cases')
    .select('id, loan_id, rescue_amount, is_saved, loan_type, block_number')
    .eq('id', rescueCaseId)
    .single()
  if (!rc) throw new HttpError(404, 'Rescue case not found', 'not_found')
  if (rc.is_saved) throw new HttpError(409, 'Already rescued', 'already_saved')

  const { data: loan } = await admin
    .from('loans')
    .select('id, user_id, ifsc, loan_account_encrypted, verification_status, outstanding, profiles!loans_user_id_fkey(full_name)')
    .eq('id', rc.loan_id)
    .single()
  if (!loan || loan.verification_status !== 'verified') throw new HttpError(409, 'Loan is not verified', 'not_verified')
  if (rc.rescue_amount > loan.outstanding) throw new HttpError(422, 'Rescue amount exceeds outstanding', 'over_outstanding')

  // Idempotency: one payout per rescue case. The unique provider_ref blocks a double trigger.
  const ref = `rescue-${rc.id}`
  const { data: txn, error: tErr } = await admin
    .from('transactions')
    .insert({ user_id: loan.user_id, loan_id: loan.id, type: 'rescue_payout', amount: rc.rescue_amount, status: 'initiated', provider_ref: ref, block_number: rc.block_number })
    .select('id')
    .single()
  if (tErr) throw new HttpError(409, 'Payout already initiated for this case', 'duplicate_payout')

  await audit(req, caller.user.id, 'admin.rescue_payout.initiated', { rescue_case_id: rc.id, loan_id: loan.id, amount: rc.rescue_amount, txn_id: txn.id })

  const accountNumber = await decryptField(loan.loan_account_encrypted, `loan:${loan.id}`)
  const name = (loan.profiles as { full_name?: string } | null)?.full_name ?? 'KarjMukt Borrower'
  let payout
  try {
    payout = await payToLoanAccount({
      referenceId: ref,
      name,
      ifsc: loan.ifsc,
      accountNumber,
      amountRupees: rc.rescue_amount,
      purpose: 'payout',
      narration: 'KarjMukt Rescue',
    })
  } catch (e) {
    await admin.from('transactions').update({ status: 'failed' }).eq('id', txn.id)
    await audit(req, caller.user.id, 'admin.rescue_payout.failed', { rescue_case_id: rc.id, txn_id: txn.id })
    throw e
  }

  const done = payout.status === 'processed'
  await admin
    .from('transactions')
    .update({ status: done ? 'success' : 'processing', utr_no: payout.utr ?? null, provider_payout_id: payout.id })
    .eq('id', txn.id)
  if (done) {
    await admin.from('rescue_cases').update({ is_saved: true, saved_at: new Date().toISOString() }).eq('id', rc.id)
  }
  await audit(req, caller.user.id, 'admin.rescue_payout.submitted', { rescue_case_id: rc.id, txn_id: txn.id, payout_id: payout.id, status: payout.status })
  return json(req, { transactionId: txn.id, status: payout.status, utr: payout.utr })
})
