import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { m } from 'framer-motion'
import { GraduationCap, HeartHandshake, Home as HomeIcon, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TableSkeleton } from '@/components/states/Skeletons'
import { useRescueWall } from '@/hooks/queries'
import { useT } from '@/i18n'
import { formatCompactINR, formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/stores/ui'

const ROW = 76

/** Virtualized realtime wall. Rows slide in from x -20; a live rescue pops in with scale + gold glow. */
export function RescueWall() {
  const t = useT()
  const lang = useUiStore((s) => s.lang)
  const q = useRescueWall()
  const items = useMemo(() => q.data?.pages.flat() ?? [], [q.data])
  const parentRef = useRef<HTMLDivElement>(null)
  const virt = useVirtualizer({ count: items.length + (q.hasNextPage ? 1 : 0), getScrollElement: () => parentRef.current, estimateSize: () => ROW, overscan: 6 })
  const virtualItems = virt.getVirtualItems()
  const lastIndex = virtualItems.at(-1)?.index ?? 0
  const firstIndex = virtualItems[0]?.index ?? 0

  useEffect(() => {
    if (lastIndex >= items.length - 1 && q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage()
  }, [lastIndex, items.length, q])

  return (
    <Card variant="glass" className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HeartHandshake className="size-6 text-accent-700" aria-hidden />
          {t('rescue_wall')}
          <span className="relative ml-1 flex size-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-pill bg-accent opacity-75" />
            <span className="relative inline-flex size-2 rounded-pill bg-accent" />
          </span>
        </CardTitle>
        <CardDescription>{t('rescue_wall_d')}</CardDescription>
      </CardHeader>
      <CardContent>
        {q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} retrying={q.isRefetching} />
        ) : q.isLoading ? (
          <TableSkeleton rows={4} />
        ) : items.length === 0 ? (
          <EmptyState icon={HeartHandshake} title={t('empty_title')} description={t('empty_rescue')} />
        ) : (
          <div ref={parentRef} className="h-80 overflow-y-auto overscroll-contain" aria-live="polite">
            <ul style={{ height: virt.getTotalSize(), position: 'relative' }}>
              {virtualItems.map((v) => {
                const r = items[v.index]
                const isNew = !!r && q.freshIds.has(r.id)
                return (
                  <li key={v.key} className="absolute inset-x-0 py-1" style={{ top: v.start, height: ROW }}>
                    {r ? (
                      <m.div
                        initial={isNew ? { opacity: 0, scale: 0.9 } : { opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={isNew ? { type: 'spring', stiffness: 400, damping: 18 } : { duration: 0.35, ease: 'easeOut', delay: Math.min(0.4, (v.index - firstIndex) * 0.05) }}
                        className={cn(
                          'flex h-full items-center gap-3 rounded-modal border px-3 transition-colors',
                          isNew ? 'animate-gold-glow border-secondary bg-secondary-50' : 'border-transparent hover:border-border hover:bg-white',
                        )}
                      >
                        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-pill', r.loan_type === 'education' ? 'bg-primary-50 text-primary' : 'bg-secondary-50 text-secondary-800')}>
                          {r.loan_type === 'education' ? <GraduationCap className="size-4" aria-hidden /> : <HomeIcon className="size-4" aria-hidden />}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="flex items-center gap-1 truncate text-sm font-semibold">
                            {r.display_name}
                            {isNew && <Sparkles className="size-3 text-secondary-800" aria-label={t('live_label')} />}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{r.story ?? formatDate(r.saved_at, lang)}</p>
                        </div>
                        <Badge variant="success" className="shrink-0 tabular">
                          {formatCompactINR(r.rescue_amount)}
                        </Badge>
                      </m.div>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">…</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
