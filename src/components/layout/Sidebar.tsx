import { NavLink } from 'react-router-dom'
import { m } from 'framer-motion'
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/Logo'
import { useT } from '@/i18n'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav'
import { LangToggle } from './LangToggle'

/**
 * Tablet (768-1024): collapsible (icon rail <-> 280px).
 * Desktop (>1024): fixed 280px.
 */
export function Sidebar({ items, onLogout }: { items: NavItem[]; onLogout: () => void }) {
  const t = useT()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggle = useUiStore((s) => s.toggleSidebar)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/20 bg-white/80 backdrop-blur-xl transition-[width] duration-200 md:flex',
        collapsed ? 'md:w-20 lg:w-70' : 'md:w-70',
      )}
      aria-label="Sidebar"
    >
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <Logo compact={collapsed} className={cn(collapsed && 'lg:hidden')} />
        {collapsed && <Logo className="hidden lg:inline-flex" />}
      </div>
      <nav className="isolate flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                title={t(label)}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-11 items-center gap-3 rounded-card px-3 text-sm font-medium transition-colors',
                    isActive ? 'text-primary-foreground' : 'text-neutral-600 hover:bg-muted hover:text-foreground',
                    collapsed && 'md:justify-center lg:justify-start',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <m.span layoutId="sidebar-pill" className="absolute inset-0 -z-10 rounded-card bg-primary shadow-md" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                    {isActive && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-pill bg-secondary" />}
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className={cn(collapsed && 'md:sr-only lg:not-sr-only')}>{t(label)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex flex-col gap-2 border-t border-border p-3">
        <LangToggle className={cn('justify-start', collapsed && 'md:justify-center lg:justify-start')} />
        <Button variant="ghost" size="sm" onClick={onLogout} className={cn('justify-start', collapsed && 'md:justify-center lg:justify-start')}>
          <LogOut aria-hidden />
          <span className={cn(collapsed && 'md:sr-only lg:not-sr-only')}>{t('nav_logout')}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="justify-center lg:hidden"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronsRight aria-hidden /> : <ChevronsLeft aria-hidden />}
        </Button>
      </div>
    </aside>
  )
}
