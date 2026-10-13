import { Home, LayoutDashboard, Landmark, Share2, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { DictKey } from '@/i18n'

export interface NavItem {
  to: string
  label: DictKey
  icon: LucideIcon
  adminOnly?: boolean
}

export const NAV: NavItem[] = [
  { to: '/', label: 'nav_home', icon: Home },
  { to: '/dashboard', label: 'nav_dashboard', icon: LayoutDashboard },
  { to: '/bank', label: 'nav_bank', icon: Landmark },
  { to: '/refer', label: 'nav_refer', icon: Share2 },
  { to: '/admin', label: 'nav_admin', icon: ShieldCheck, adminOnly: true },
]
