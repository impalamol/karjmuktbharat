import { cn } from '@/lib/utils'

/** Shimmer skeleton: a light sweep moves across, never a static grey block. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-card bg-neutral-200/70',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
