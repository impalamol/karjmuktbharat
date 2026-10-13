import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { m } from 'framer-motion'
import { cn } from '@/lib/utils'

/** shadcn Progress whose indicator animates its width (easeInOut 1.5s) and can shimmer. */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { indicatorClassName?: string; shimmer?: boolean; duration?: number }
>(({ className, value, indicatorClassName, shimmer = false, duration = 1.5, ...props }, ref) => (
  <ProgressPrimitive.Root ref={ref} value={value} className={cn('relative h-2 w-full overflow-hidden rounded-pill bg-muted', className)} {...props}>
    <ProgressPrimitive.Indicator asChild>
      <m.div
        className={cn(
          'relative h-full overflow-hidden rounded-pill bg-primary',
          shimmer && 'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent',
          indicatorClassName,
        )}
        initial={{ width: '0%' }}
        animate={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
        transition={{ duration, ease: 'easeInOut' }}
      />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
