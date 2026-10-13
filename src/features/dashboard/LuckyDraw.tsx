import { useEffect, useMemo, useState } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { Gift, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/states/ErrorState'
import { useLuckyDraw } from '@/hooks/queries'
import { useT } from '@/i18n'
import { colors } from '@/lib/design-tokens'

function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, (target ? new Date(target).getTime() : now) - now)
  return {
    done: diff === 0,
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1000) % 60),
  }
}

const SEGMENTS = 8
const SEG_COLORS = [colors.primary.DEFAULT, colors.secondary.DEFAULT, colors.accent.DEFAULT, colors.primary[400]]

export function LuckyDraw() {
  const t = useT()
  const q = useLuckyDraw()
  const c = useCountdown(q.data?.draw_at)
  const reduce = useReducedMotion()

  const slices = useMemo(
    () =>
      Array.from({ length: SEGMENTS }, (_, i) => {
        const a0 = (i / SEGMENTS) * 2 * Math.PI
        const a1 = ((i + 1) / SEGMENTS) * 2 * Math.PI
        return {
          d: `M50,50 L${50 + 48 * Math.sin(a0)},${50 - 48 * Math.cos(a0)} A48,48 0 0,1 ${50 + 48 * Math.sin(a1)},${50 - 48 * Math.cos(a1)} Z`,
          fill: SEG_COLORS[i % SEG_COLORS.length]!,
        }
      }),
    [],
  )

  const units: [number, string][] = [
    [c.d, t('days')],
    [c.h, t('hours')],
    [c.m, t('mins')],
    [c.s, t('secs')],
  ]

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="size-6 text-secondary-600" aria-hidden />
          {t('lucky_draw')}
        </CardTitle>
        <CardDescription>{q.data?.prize ?? t('lucky_draw_d')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.isLoading ? (
          <Skeleton className="size-48 rounded-pill" />
        ) : (
          <>
            <div className="relative size-48">
              <m.svg
                viewBox="0 0 100 100"
                className="size-48"
                animate={reduce || q.data?.winner_display ? undefined : { rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                aria-hidden
              >
                {slices.map((s, i) => (
                  <path key={i} d={s.d} fill={s.fill} stroke="#fff" strokeWidth={0.8} />
                ))}
                <circle cx="50" cy="50" r="10" fill="#fff" />
                <circle cx="50" cy="50" r="6" fill={colors.secondary.DEFAULT} />
              </m.svg>
              <div aria-hidden className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 border-x-8 border-t-8 border-x-transparent border-t-secondary" />
            </div>
            {q.data?.winner_display ? (
              <Badge variant="secondary" className="text-sm">
                <Sparkles aria-hidden /> {t('winner')}: {q.data.winner_display}
              </Badge>
            ) : (
              <>
                <div className="grid w-full grid-cols-4 gap-2" role="timer" aria-live="off">
                  {units.map(([v, l]) => (
                    <div key={l} className="flex flex-col items-center rounded-card bg-primary p-2 text-primary-foreground">
                      <span className="text-2xl font-bold tabular">{String(v).padStart(2, '0')}</span>
                      <span className="text-xs text-primary-200">{l}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{t('draw_pending')}</p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
