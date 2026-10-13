import { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/states/ErrorState'
import { useBlockSeats, usePool } from '@/hooks/queries'
import { useT } from '@/i18n'
import { calculateBlockBreakdown, type BlockType } from '@/lib/calculations'
import { formatCompactINR, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

const SEATS = 1000
const CELL = 32 // px, avatar 28 + gap 4

/** 1,000-seat block grid. Rows are virtualized, so only visible avatars are in the DOM. */
export function BlockGrid({ type, block }: { type: BlockType; block: number }) {
  const t = useT()
  const pool = usePool(type, block)
  const seats = useBlockSeats(type, block)
  const parentRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(10)

  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setCols(Math.max(6, Math.floor(((e?.contentRect.width ?? 320) - 12) / CELL))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const bySeat = useMemo(() => new Map((seats.data ?? []).map((s) => [s.seat_number, s])), [seats.data])
  const rows = Math.ceil(SEATS / cols)
  const virt = useVirtualizer({ count: rows, getScrollElement: () => parentRef.current, estimateSize: () => CELL, overscan: 4 })

  const filled = pool.data?.total_users ?? seats.data?.length ?? 0
  const b = calculateBlockBreakdown(type, Math.min(filled, SEATS))

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle>{t('my_block')}</CardTitle>
          <CardDescription>
            {t('block')} #{block} · {formatNumber(filled)}/{formatNumber(SEATS)} {t('seats_filled')}
          </CardDescription>
        </div>
        <Badge variant="outline"><Users aria-hidden />{formatCompactINR(b.totalPool)}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={(filled / SEATS) * 100} indicatorClassName="bg-secondary" aria-label={`${filled} of ${SEATS}`} />
        {seats.isError ? (
          <ErrorState error={seats.error} onRetry={() => seats.refetch()} retrying={seats.isRefetching} />
        ) : seats.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div ref={parentRef} className="h-64 overflow-y-auto overscroll-contain rounded-card border border-border p-1" role="grid" aria-label={t('my_block')}>
            <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
              {virt.getVirtualItems().map((row) => (
                <div key={row.key} role="row" className="absolute inset-x-0 flex gap-1" style={{ top: row.start, height: CELL }}>
                  {Array.from({ length: cols }, (_, c) => {
                    const n = row.index * cols + c + 1
                    if (n > SEATS) return null
                    const s = bySeat.get(n)
                    return (
                      <div
                        key={n}
                        role="gridcell"
                        title={s ? `${t('seat')} ${n}${s.is_me ? ` · ${t('you')}` : ''}` : `${t('seat')} ${n}`}
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-pill text-xs font-semibold',
                          s?.is_me
                            ? 'bg-secondary text-secondary-foreground ring-2 ring-primary'
                            : s
                              ? 'bg-primary-100 text-primary'
                              : 'border border-dashed border-neutral-300 text-neutral-300',
                        )}
                      >
                        {s ? (s.is_me ? '★' : s.initials) : ''}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
