import { ArrowDownLeft, ArrowUpRight, LifeBuoy } from 'lucide-react-native'
import { colors } from '@/theme/tokens'
import { formatDate, formatINR } from './format'
import type { Txn } from './types'

const KIND: Record<Txn['type'], { title: string; icon: typeof ArrowDownLeft; bg: string; fg: string; sign: string }> = {
  regular_credit: { title: 'Karj Mukti credit', icon: ArrowDownLeft, bg: colors.mint.DEFAULT, fg: colors.mint.ink, sign: '+' },
  rescue_payout: { title: 'Rescue payout', icon: LifeBuoy, bg: colors.sky.DEFAULT, fg: colors.sky.ink, sign: '+' },
  mandate_debit: { title: 'Monthly contribution', icon: ArrowUpRight, bg: colors.beige.DEFAULT, fg: colors.beige.ink, sign: '-' },
}

export const STATUS_LABEL: Record<Txn['status'], string> = { initiated: 'Initiated', processing: 'Processing', success: 'Success', failed: 'Failed', reversed: 'Reversed' }

/** Transaction -> ListRow props. */
export function txnRow(t: Txn) {
  const k = KIND[t.type]
  return {
    icon: k.icon,
    iconBg: k.bg,
    iconColor: k.fg,
    title: k.title,
    subtitle: `${formatDate(t.created_at)} · ${STATUS_LABEL[t.status]}`,
    amount: `${k.sign}${formatINR(t.amount)}`,
    amountClass: k.sign === '+' ? 'text-mint-ink' : 'text-ink',
  }
}
