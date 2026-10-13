import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AnimatePresence, m } from 'framer-motion'
import { Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/states/ErrorState'
import { useBlockSeats, usePool, type Seat } from '@/hooks/queries'
import { useT } from '@/i18n'
import { calculateBlockBreakdown, type BlockType } from '@/lib/calculations'
import { formatCompactINR, formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

const SEATS = 1000
const CELL = 24 // 20px dot + 4px gap

interface DotProps {
  n: number
  seat?: Seat
  isNew: boolean
  delay: number
  label: string
  onHover: (n: number | null) => void
}

/** One seat. Scales in with a stagger; a member who just joined springs from 0 to 1 with a gold glow. */
const Dot = memo(function Dot({ n, seat, isNew, delay, label, onHover }: DotProps) {
  return (
    <m.div
      role="gridcell"
      aria-label={label}
      tabIndex={seat?.is_me ? 0 : -1}
      onMouseEnter={() => onHover(n)}
      onFocus={() => onHover(n)}
      onMouseLeave={() => onHover(null)}
      onBlur={() => onHover(null)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={isNew ? { type: 'spring', stiffness: 500, damping: 15 } : { delay, duration: 0.25, ease: 'easeOut' }}
      whileHover={{ scale: 1.4 }}
      className={cn(
        'size-5 shrink-0 rounded-pill focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        seat?.is_me
          ? 'bg-secondary ring-2 ring-primary ring-offset-1'
          : seat
            ? 'bg-primary'
            : 'border border-dashed border-neutral-300 bg-transparent',
        isNew && 'animate-gold-glow',
      )}
    />
  )
})

/** 1,000-seat block. Rows are virtualized, so only visible dots exist in the DOM. Hover or focus a dot to see who sits there. */
export function BlockGrid({ type, block }: { type: BlockType; block: number }) {
  const t = useT()
  const pool = usePool(type, block)
  const seats = useBlockSeats(type, block)
  const parentRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(12)
  const [hovered, setHovered] = useState<number | null>(null)

  // Seats that appear after the first load are "new joiners" and get the spring + glow.
  const known = useRef<Set<number> | null>(null)
  const [fresh, setFresh] = useState<Set<number>>(new Set())
  useEffect(() => {
    if (!seats.data) return
    const now = new Set(seats.data.map((s) => s.seat_number))
    if (known.current) setFresh(new Set([...now].filter((n) => !known.current!.has(n))))
    known.current = now
  }, [seats.data])

  useEffect(() => {
    const el = parentRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setCols(Math.max(8, Math.floor(((e?.contentRect.width ?? 320) + 4) / CELL))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [seats.isLoading])

  const bySeat = useMemo(() => new Map((seats.data ?? []).map((s) => [s.seat_number, s])), [seats.data])
  const rows = Math.ceil(SEATS / cols)
  const virt = useVirtualizer({ count: rows, getScrollElement: () => parentRef.current, estimateSize: () => CELL, overscan: 4 })

  const filled = pool.data?.total_users ?? seats.data?.length ?? 0
  const b = calculateBlockBreakdown(type, Math.min(filled, SEATS))
  const hoveredSeat = hovered ? bySeat.get(hovered) : undefined

  return (
    <Card variant="glass" className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl">{t('my_block')}</CardTitle>
          <CardDescription>
            {t('block')} #{block} · {formatNumber(filled)}/{formatNumber(SEATS)} {t('seats_filled')}
          </CardDescription>
        </div>
        <Badge variant="outline">
          <Users aria-hidden />
          {formatCompactINR(b.totalPool)}
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={(filled / SEATS) * 100} shimmer indicatorClassName="bg-gradient-to-r from-primary to-secondary" aria-label={`${filled} of ${SEATS}`} />
        <div className="flex h-6 items-center gap-2 text-xs" aria-live="polite">
          <AnimatePresence mode="wait">
            <m.span key={hovered ?? 'legend'} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="flex items-center gap-2">
              {hovered ? (
                <>
                  <span className="font-semibold">
                    {t('seat')} {hovered}
                  </span>
                  <span className="text-muted-foreground">{hoveredSeat ? `${hoveredSeat.initials}${hoveredSeat.is_me ? ` · ${t('you')}` : ''}` : t('seat_open')}</span>
                </>
              ) : (
                <>
                  <span className="size-3 rounded-pill bg-secondary ring-1 ring-primary" /> {t('you')}
                  <span className="size-3 rounded-pill bg-primary" /> {t('members_lbl')}
                  <span className="size-3 rounded-pill border border-dashed border-neutral-400" /> {t('seat_open')}
                </>
              )}
            </m.span>
          </AnimatePresence>
        </div>
        {seats.isError ? (
          <ErrorState error={seats.error} onRetry={() => seats.refetch()} retrying={seats.isRefetching} />
        ) : seats.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div ref={parentRef} tabIndex={0} className="h-64 overflow-y-auto overscroll-contain rounded-modal bg-white/60 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" role="grid" aria-label={t('my_block')}>
            <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
              {virt.getVirtualItems().map((row) => (
                <div key={row.key} role="row" className="absolute inset-x-0 flex gap-1" style={{ top: row.start, height: CELL }}>
                  {Array.from({ length: cols }, (_, c) => {
                    const n = row.index * cols + c + 1
                    if (n > SEATS) return null
                    const s = bySeat.get(n)
                    return (
                      <Dot
                        key={n}
                        n={n}
                        seat={s}
                        isNew={fresh.has(n)}
                        delay={Math.min(0.6, (row.index % 12) * 0.03 + c * 0.01)}
                        label={`${t('seat')} ${n}${s ? ` · ${s.initials}${s.is_me ? ` · ${t('you')}` : ''}` : ''}`}
                        onHover={setHovered}
                      />
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
