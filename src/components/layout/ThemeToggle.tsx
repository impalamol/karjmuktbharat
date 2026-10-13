import { AnimatePresence, m } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui'
import { cn } from '@/lib/utils'

/** Sun / moon switch. The icon rotates out and the next one springs in. */
export function ThemeToggle({ className, withLabel = false }: { className?: string; withLabel?: boolean }) {
  const theme = useUiStore((s) => s.theme)
  const toggle = useUiStore((s) => s.toggleTheme)
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button variant="ghost" size={withLabel ? 'sm' : 'icon'} onClick={toggle} className={cn('overflow-hidden', className)} aria-label={`Switch to ${next} theme`}>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={theme}
          className="flex"
          initial={{ rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {theme === 'dark' ? <Moon aria-hidden className="size-5" /> : <Sun aria-hidden className="size-5" />}
        </m.span>
      </AnimatePresence>
      {withLabel && <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>}
    </Button>
  )
}
