import { NavLink } from 'react-router-dom'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav'

/** Mobile (<768px) PhonePe-style bottom navigation. 44px+ touch targets, safe-area aware. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const t = useT()
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-lg backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto grid h-16 max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-full min-h-11 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn('flex h-8 w-12 items-center justify-center rounded-pill transition-colors', isActive && 'bg-primary-50')}>
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <span className="truncate">{t(label)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
