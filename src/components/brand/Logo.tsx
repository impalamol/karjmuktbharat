import { cn } from '@/lib/utils'

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold tracking-tight', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#0F2C61" />
        <path d="M9 22V10h3v5l5-5h4l-6 6 6 6h-4l-5-5v5z" fill="#FFB703" />
        <circle cx="24" cy="9" r="2" fill="#059669" />
      </svg>
      {!compact && (
        <span className="text-lg leading-none">
          KARJMUKT<span className="text-secondary-600">BHARAT</span>
        </span>
      )}
    </span>
  )
}
