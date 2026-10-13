import { cn } from '@/lib/utils'

/** Theme-aware wordmark. `onDark` forces light text on an always-dark surface. */
export function Logo({ className, compact = false, onDark = false }: { className?: string; compact?: boolean; onDark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect x="0.5" y="0.5" width="31" height="31" rx="8" fill="#0F2C61" stroke="rgb(255 255 255 / 0.16)" />
        <path d="M9 22V10h3v5l5-5h4l-6 6 6 6h-4l-5-5v5z" fill="#FFB703" />
        <circle cx="24" cy="9" r="2" fill="#059669" />
      </svg>
      {!compact && (
        <span className={cn('text-lg leading-none', onDark ? 'text-white' : 'text-foreground')}>
          KARJMUKT<span className={onDark ? 'text-secondary' : 'text-secondary-800'}>BHARAT</span>
        </span>
      )}
    </span>
  )
}
