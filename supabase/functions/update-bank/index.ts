// Bank / loan account change. Requires 2FA (aal2). Resets verification so an admin re-checks it.
import { admin, requireAal2, requireUser } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { encryptField } from '../_shared/crypto.ts'
import { HttpError, json, readJson, serve } from '../_shared/http.ts'
import { bankUpdate } from '../_shared/validation.ts'

serve(['POST'], async (req) => {
  const caller = await requireUser(req)
  requireAal2(caller)
  const input = bankUpdate.parse(await readJson(req))

  const { data: loan } = await admin
    .from('loans')
    .select('id, user_id, loan_account_last4, bank_name')
    .eq('id', input.loanId)
    .single()
  if (!loan || loan.user_id !== caller.user.id) throw new HttpError(404, 'Loan not found', 'not_found')

  const { count } = await admin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('loan_id', loan.id)
    .in('status', ['initiated', 'processing'])
  if ((count ?? 0) > 0) throw new HttpError(409, 'A payment is in progress. Try again after it completes.', 'payout_in_progress')

  const { error } = await admin
    .from('loans')
    .update({
      bank_name: input.bankName,
      ifsc: input.ifsc,
      loan_account_encrypted: await encryptField(input.loanAccount, `loan:${loan.id}`),
      loan_account_last4: input.loanAccount.slice(-4),
      verification_status: 'pending',
    })
    .eq('id', loan.id)
  if (error) throw new HttpError(500, 'Could not update bank details', 'db_error')

  await audit(req, caller.user.id, 'bank.changed', {
    loan_id: loan.id,
    from: { bank: loan.bank_name, last4: loan.loan_account_last4 },
    to: { bank: input.bankName, last4: input.loanAccount.slice(-4) },
  })
  return json(req, { ok: true, status: 'pending', last4: input.loanAccount.slice(-4) })
})
