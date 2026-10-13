import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, m, useMotionValue, useReducedMotion, type PanInfo } from 'framer-motion'
import { Gift, RotateCw, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/states/ErrorState'
import { useLuckyDraw } from '@/hooks/queries'
import { useT } from '@/i18n'
import { celebrate } from '@/lib/confetti'
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
/** Fixed particle layout (left %, delay s, duration s) so renders stay pure. */
const PARTICLES = [
  [8, 0, 3.2],
  [22, 1.1, 4],
  [38, 0.4, 3.6],
  [55, 1.8, 3.1],
  [70, 0.7, 4.2],
  [84, 1.4, 3.4],
  [93, 2.2, 3.8],
] as const

/** Angle in degrees of a point relative to the wheel centre. */
const angleOf = (el: HTMLElement, x: number, y: number) => {
  const r = el.getBoundingClientRect()
  return (Math.atan2(y - (r.top + r.height / 2), x - (r.left + r.width / 2)) * 180) / Math.PI
}

/**
 * Diwali lucky-draw wheel. A 3D-tilted wheel the member can fling (drag with inertia)
 * or spin 5 full turns with a spring. Purely decorative: the real winner is picked
 * server-side by `pick-winner` with a crypto-random draw.
 */
export function LuckyDraw() {
  const t = useT()
  const q = useLuckyDraw()
  const c = useCountdown(q.data?.draw_at)
  const reduce = useReducedMotion()
  const rotation = useMotionValue(0)
  const wheelRef = useRef<HTMLDivElement>(null)
  const lastAngle = useRef(0)
  const [spinning, setSpinning] = useState(false)

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

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    const target = rotation.get() + 360 * 5 + Math.random() * 360
    void animate(rotation, target, {
      type: 'spring',
      stiffness: 20,
      damping: 12,
      restDelta: 0.5,
      onComplete: () => {
        setSpinning(false)
        void celebrate('burst')
      },
    })
  }

  const onPanStart = (_: PointerEvent, info: PanInfo) => {
    rotation.stop()
    if (wheelRef.current) lastAngle.current = angleOf(wheelRef.current, info.point.x, info.point.y)
  }
  const onPan = (_: PointerEvent, info: PanInfo) => {
    if (!wheelRef.current) return
    const a = angleOf(wheelRef.current, info.point.x, info.point.y)
    let delta = a - lastAngle.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    rotation.set(rotation.get() + delta)
    lastAngle.current = a
  }
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    // Linear flick speed (px/s) becomes angular velocity (deg/s); the inertia decays it.
    const v = Math.hypot(info.velocity.x, info.velocity.y)
    const dir = info.velocity.x >= 0 ? 1 : -1
    if (v < 50) return
    void animate(rotation, rotation.get(), { type: 'inertia', velocity: dir * Math.min(v, 4000), power: 0.8, timeConstant: 700 })
  }

  const units: [number, string][] = [
    [c.d, t('days')],
    [c.h, t('hours')],
    [c.m, t('mins')],
    [c.s, t('secs')],
  ]

  return (
    <Card variant="brand" className="relative h-full overflow-hidden">
      {!reduce && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {PARTICLES.map(([left, delay, duration]) => (
            <m.span
              key={left}
              className="absolute bottom-0 size-2 rounded-pill bg-secondary shadow-[0_0_12px_rgb(255_183_3/0.9)]"
              style={{ left: `${left}%` }}
              animate={{ y: [0, -320], opacity: [0, 1, 0] }}
              transition={{ duration, delay, repeat: Infinity, ease: 'easeOut' }}
            />
          ))}
        </div>
      )}
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Gift className="size-6 text-secondary" aria-hidden />
          {q.data?.title ?? t('lucky_draw')}
        </CardTitle>
        <CardDescription className="text-primary-100">{q.data?.prize ?? t('lucky_draw_d')}</CardDescription>
      </CardHeader>
      <CardContent className="relative flex flex-col items-center gap-4">
        {q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} />
        ) : q.isLoading ? (
          <Skeleton className="size-48 rounded-pill" />
        ) : (
          <>
            <div className="relative size-48 [perspective:800px]">
              <m.div
                ref={wheelRef}
                role="img"
                aria-label={t('spin_wheel')}
                className="size-48 cursor-grab touch-none select-none rounded-pill shadow-lg active:cursor-grabbing"
                style={{ rotate: rotation, rotateX: 18 }}
                onPanStart={onPanStart}
                onPan={onPan}
                onPanEnd={onPanEnd}
              >
                <svg viewBox="0 0 100 100" className="size-48" aria-hidden>
                  {slices.map((s, i) => (
                    <path key={i} d={s.d} fill={s.fill} stroke="#fff" strokeWidth={0.8} />
                  ))}
                  <circle cx="50" cy="50" r="48" fill="none" stroke={colors.secondary.DEFAULT} strokeWidth={1.5} />
                  <circle cx="50" cy="50" r="10" fill="#fff" />
                  <circle cx="50" cy="50" r="6" fill={colors.secondary.DEFAULT} />
                </svg>
              </m.div>
              <div aria-hidden className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 border-x-8 border-t-8 border-x-transparent border-t-secondary drop-shadow" />
            </div>
            <Button variant="glow" onClick={spin} disabled={spinning} aria-label={t('spin_wheel')}>
              <RotateCw aria-hidden className={spinning ? 'animate-spin' : undefined} />
              {t('spin_wheel')}
            </Button>
            {q.data?.winner_display ? (
              <Badge variant="secondary" className="text-sm">
                <Sparkles aria-hidden /> {t('winner')}: {q.data.winner_display}
              </Badge>
            ) : (
              <>
                <div className="grid w-full grid-cols-4 gap-2" role="timer" aria-live="off">
                  {units.map(([v, l]) => (
                    <div key={l} className="flex flex-col items-center rounded-card border border-white/20 bg-white/10 p-2 backdrop-blur-xl">
                      <span className="text-2xl font-bold tabular">{String(v).padStart(2, '0')}</span>
                      <span className="text-xs text-primary-100">{l}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-primary-100">{t('spin_hint')}</p>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
