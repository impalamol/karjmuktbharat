// Admin approves / rejects a loan. Approval seats it in a block (DB trigger).
import { z } from 'npm:zod@3'
import { admin, requireAdmin } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { HttpError, json, readJson, serve } from '../_shared/http.ts'

const body = z
  .object({
    loanId: z.string().uuid(),
    decision: z.enum(['verified', 'rejected']),
    reason: z.string().max(300).optional(),
    markAuction: z.boolean().optional(),
  })
  .strict()
  .refine((b) => b.decision === 'verified' || (b.reason && b.reason.trim().length >= 5), { path: ['reason'], message: 'Reason required' })

serve(['POST'], async (req) => {
  const caller = await requireAdmin(req)
  const input = body.parse(await readJson(req))

  const { data: loan, error } = await admin
    .from('loans')
    .update({
      verification_status: input.decision,
      rejection_reason: input.decision === 'rejected' ? input.reason : null,
      verified_by: caller.user.id,
      ...(input.markAuction !== undefined ? { is_auction_case: input.markAuction } : {}),
    })
    .eq('id', input.loanId)
    .eq('verification_status', 'pending')
    .select('id, user_id, loan_type, block_number, seat_number, is_auction_case')
    .maybeSingle()
  if (error) throw new HttpError(500, 'Could not update loan', 'db_error')
  if (!loan) throw new HttpError(409, 'Loan is not pending', 'not_pending')

  await audit(req, caller.user.id, `admin.loan.${input.decision}`, {
    loan_id: loan.id,
    borrower_id: loan.user_id,
    block_number: loan.block_number,
    seat_number: loan.seat_number,
    reason: input.reason ?? null,
  })
  return json(req, { loan })
})
