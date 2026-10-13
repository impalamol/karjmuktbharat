import { useEffect, useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { GraduationCap, HeartHandshake, Home as HomeIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TableSkeleton } from '@/components/states/Skeletons'
import { useRescueWall } from '@/hooks/queries'
import { useT } from '@/i18n'
import { formatCompactINR, formatDate } from '@/lib/format'
import { useUiStore } from '@/stores/ui'

const ROW = 72

/** Virtualized, realtime rescue wall. Loads 20 at a time as you scroll. */
export function RescueWall() {
  const t = useT()
  const lang = useUiStore((s) => s.lang)
  const q = useRescueWall()
  const items = useMemo(() => q.data?.pages.flat() ?? [], [q.data])
  const parentRef = useRef<HTMLDivElement>(null)
  const virt = useVirtualizer({ count: items.length + (q.hasNextPage ? 1 : 0), getScrollElement: () => parentRef.current, estimateSize: () => ROW, overscan: 6 })
  const virtualItems = virt.getVirtualItems()
  const lastIndex = virtualItems.at(-1)?.index ?? 0

  useEffect(() => {
    if (lastIndex >= items.length - 1 && q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage()
  }, [lastIndex, items.length, q])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="size-6 text-accent" aria-hidden />
          {t('rescue_wall')}
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
                return (
                  <li key={v.key} className="absolute inset-x-0" style={{ top: v.start, height: ROW }}>
                    {r ? (
                      <div className="flex h-full items-center gap-3 border-b border-border px-1">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-accent-50 text-accent">
                          {r.loan_type === 'education' ? <GraduationCap className="size-4" aria-hidden /> : <HomeIcon className="size-4" aria-hidden />}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="truncate text-sm font-semibold">{r.display_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.story ?? formatDate(r.saved_at, lang)}</p>
                        </div>
                        <Badge variant="success" className="shrink-0 tabular">{formatCompactINR(r.rescue_amount)}</Badge>
                      </div>
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
