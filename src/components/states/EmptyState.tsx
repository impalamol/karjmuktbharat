import { lazy, Suspense } from 'react'
import { m } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'
import type { LottieName } from '@/components/brand/LottieAnim'

const LottieAnim = lazy(() => import('@/components/brand/LottieAnim'))

interface Props {
  title: string
  description?: string
  /** Lottie animation shown instead of a static icon */
  animation?: LottieName
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, animation = 'empty', icon: Icon = Inbox, action, className }: Props) {
  const fallback = (
    <div className="flex size-24 items-center justify-center rounded-pill bg-primary-50 text-primary">
      <Icon className="size-8" aria-hidden />
    </div>
  )
  return (
    <m.div role="status" initial="hidden" animate="show" variants={fadeUp} className={cn('flex flex-col items-center justify-center gap-3 px-4 py-12 text-center', className)}>
      <Suspense fallback={fallback}>
        <LottieAnim name={animation} className="size-24" />
      </Suspense>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </m.div>
  )
}
