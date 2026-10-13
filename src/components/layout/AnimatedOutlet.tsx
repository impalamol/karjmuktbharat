import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, m } from 'framer-motion'
import { pageTransition } from '@/lib/motion'

/** Route content enters from y 20 / opacity 0 (0.5s easeOut). The leaving page is frozen while it fades. */
export function AnimatedOutlet() {
  const location = useLocation()
  const outlet = useOutlet()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={location.pathname} {...pageTransition}>
        {outlet}
      </m.div>
    </AnimatePresence>
  )
}
