// Diwali Lucky Draw: uniform, cryptographically random pick among verified members.
import { z } from 'npm:zod@3'
import { admin, requireAal2, requireAdmin } from '../_shared/auth.ts'
import { audit } from '../_shared/audit.ts'
import { HttpError, json, readJson, serve } from '../_shared/http.ts'

const body = z.object({ drawId: z.string().uuid() }).strict()

function secureRandomInt(maxExclusive: number): number {
  // Rejection sampling to avoid modulo bias.
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0]! >= limit)
  return buf[0]! % maxExclusive
}

serve(['POST'], async (req) => {
  const caller = await requireAdmin(req)
  requireAal2(caller)
  const { drawId } = body.parse(await readJson(req))

  const { data: draw } = await admin.from('lucky_draws').select('id, draw_at, winner_user_id').eq('id', drawId).single()
  if (!draw) throw new HttpError(404, 'Draw not found', 'not_found')
  if (draw.winner_user_id) throw new HttpError(409, 'Winner already picked', 'already_picked')
  if (new Date(draw.draw_at).getTime() > Date.now()) throw new HttpError(409, 'Draw time has not arrived yet', 'too_early')

  const { count } = await admin.from('loans').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified')
  if (!count) throw new HttpError(409, 'No verified members yet', 'empty')

  const index = secureRandomInt(count)
  // Stable ordering on an indexed column; offset is fine for a one-off admin action.
  const { data: winnerLoan } = await admin
    .from('loans')
    .select('user_id, loan_type, block_number, profiles!loans_user_id_fkey(full_name)')
    .eq('verification_status', 'verified')
    .order('created_at')
    .order('id')
    .range(index, index)
    .single()
  if (!winnerLoan) throw new HttpError(500, 'Could not pick winner', 'pick_failed')

  const full = (winnerLoan.profiles as { full_name?: string } | null)?.full_name ?? 'Member'
  const [first, last] = full.split(' ')
  const display = `${first} ${last ? last[0] + '.' : ''} (Block ${winnerLoan.block_number})`.trim()

  const { error } = await admin
    .from('lucky_draws')
    .update({ winner_user_id: winnerLoan.user_id, winner_display: display, picked_at: new Date().toISOString() })
    .eq('id', draw.id)
    .is('winner_user_id', null)
  if (error) throw new HttpError(500, 'Could not save winner', 'db_error')

  await audit(req, caller.user.id, 'admin.lucky_draw.picked', { draw_id: draw.id, pool_size: count, index, winner_id: winnerLoan.user_id })
  return json(req, { winner: display, poolSize: count })
})
