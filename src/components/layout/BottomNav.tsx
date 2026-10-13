import { NavLink } from 'react-router-dom'
import { m } from 'framer-motion'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import type { NavItem } from './nav'

/** Mobile (<768px) CRED-style floating dark nav. Gold pill slides to the active tab (layoutId). 44px+ targets. */
export function BottomNav({ items }: { items: NavItem[] }) {
  const t = useT()
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 px-3 md:hidden" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      <ul
        className="mx-auto grid h-16 max-w-lg rounded-modal border border-white/10 bg-neutral-900/95 p-1 dark:bg-neutral-100/95 shadow-lg backdrop-blur-xl"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="relative">
            <NavLink
              to={to}
              end={to === '/'}
              aria-label={t(label)}
              className={({ isActive }) =>
                cn(
                  'relative z-10 flex h-full min-h-11 flex-col items-center justify-center gap-0.5 rounded-card text-xs font-medium transition-colors',
                  isActive ? 'text-secondary-foreground' : 'text-neutral-400 hover:text-white dark:text-neutral-500',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <m.span layoutId="bottom-nav-pill" className="absolute inset-0 -z-10 rounded-card bg-secondary shadow-md" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                  <m.span whileTap={{ scale: 0.85 }} className="flex">
                    <Icon className="size-6" aria-hidden />
                  </m.span>
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
