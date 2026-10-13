// Onboarding submit: validates, encrypts the loan account (AES-256-GCM) and Aadhaar,
// stores only Aadhaar last-4 in the DB, full Aadhaar encrypted in the private `kyc` bucket.
import { admin, requireUser } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { encryptBytes, encryptField } from '../_shared/crypto.ts'
import { HttpError, json, readJson, serve } from '../_shared/http.ts'
import { loanSubmission } from '../_shared/validation.ts'

serve(['POST'], async (req) => {
  const { user } = await requireUser(req)
  const input = loanSubmission.parse(await readJson(req))

  const { data: existing } = await admin
    .from('loans')
    .select('id')
    .eq('user_id', user.id)
    .eq('loan_type', input.loanType)
    .neq('verification_status', 'rejected')
    .maybeSingle()
  if (existing) throw new HttpError(409, 'You already registered this loan type', 'duplicate_loan')

  // Full Aadhaar: encrypted blob in a private bucket, bound to the user id. Never in the DB.
  const aadhaarBlob = await encryptBytes(input.aadhaar, `aadhaar:${user.id}`)
  const { error: upErr } = await admin.storage
    .from('kyc')
    .upload(`${user.id}/aadhaar.enc`, aadhaarBlob, { contentType: 'application/octet-stream', upsert: true })
  if (upErr) throw new HttpError(500, 'Could not store KYC securely', 'storage_error')

  const { error: pErr } = await admin
    .from('profiles')
    .update({ full_name: input.fullName, aadhaar_last4: input.aadhaar.slice(-4) })
    .eq('id', user.id)
  if (pErr) throw new HttpError(500, 'Could not update profile', 'db_error')

  const loanId = crypto.randomUUID()
  const { error: lErr } = await admin.from('loans').insert({
    id: loanId,
    user_id: user.id,
    loan_type: input.loanType,
    bank_name: input.bankName,
    ifsc: input.ifsc,
    loan_account_encrypted: await encryptField(input.loanAccount, `loan:${loanId}`),
    loan_account_last4: input.loanAccount.slice(-4),
    sanction_amount: input.sanctionAmount,
    outstanding: input.outstanding,
    emi: input.emi,
    interest_rate: input.interestRate,
    is_auction_case: input.isAuctionCase,
    verification_status: 'pending',
  })
  if (lErr) throw new HttpError(500, 'Could not save loan', 'db_error')

  await audit(req, user.id, 'loan.submitted', { loan_id: loanId, loan_type: input.loanType, auction: input.isAuctionCase })
  return json(req, { loanId, status: 'pending' }, 201)
})
