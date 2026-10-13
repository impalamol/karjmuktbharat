import { GraduationCap, Home } from 'lucide-react-native'
import { colors } from '@/theme/tokens'
import { formatShortINR } from './format'
import type { RescueItem } from './types'

/** "Sunita T., Nashik" -> row text for the Rescue Wall: "Sunita T. · Ghar Vachavle · Nashik". */
export function rescueRow(r: RescueItem) {
  const [name, city] = r.display_name.split(',').map((s) => s.trim())
  const home = r.loan_type === 'home'
  return {
    icon: home ? Home : GraduationCap,
    iconBg: home ? colors.beige.strong : colors.lavender.DEFAULT,
    iconColor: home ? colors.beige.ink : colors.lavender.ink,
    title: name ?? r.display_name,
    subtitle: [home ? 'Ghar Vachavle' : 'NPA Vachavla', city].filter(Boolean).join(' · '),
    amount: formatShortINR(r.rescue_amount),
  }
}
