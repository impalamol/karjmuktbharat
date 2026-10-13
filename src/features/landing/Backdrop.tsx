import { useMemo } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Contour-like wavy lines: two sine waves per line, phase-shifted per row (same maths as the mobile app). */
function contours(width: number, height: number, lines: number) {
  return Array.from({ length: lines }, (_, i) => {
    const baseY = (height / lines) * i + 20
    const a1 = 18 + (i % 5) * 4
    const a2 = 8 + (i % 3) * 5
    const p = i * 0.55
    let d = ''
    for (let x = -40; x <= width; x += 16) {
      const y = baseY + a1 * Math.sin(x / 90 + p) + a2 * Math.sin(x / 37 + p * 2.3)
      d += `${x === -40 ? 'M' : 'L'}${x},${y.toFixed(1)}`
    }
    return d
  })
}

/** Thin white topographic lines drifting slowly sideways. Decorative. */
export function Topography({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const paths = useMemo(() => contours(1800, 900, 30), [])
  return (
    <svg aria-hidden viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}>
      <m.g animate={reduce ? undefined : { x: [0, -200, 0] }} transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}>
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="white" strokeOpacity={0.18} strokeWidth={1} />
        ))}
      </m.g>
    </svg>
  )
}

interface Shape {
  kind: 'circle' | 'diamond'
  className: string
  delay: number
}

const SHAPES: Shape[] = [
  { kind: 'circle', className: 'left-[2%] bottom-[4%] size-24 bg-pastel-beigeStrong', delay: 0 },
  { kind: 'circle', className: 'right-[-4%] top-[56%] size-48 bg-pastel-skyStrong', delay: 0.6 },
  { kind: 'circle', className: 'left-[38%] bottom-[8%] size-14 bg-pastel-lavender', delay: 1.2 },
  { kind: 'circle', className: 'right-[30%] top-[10%] size-10 bg-pastel-mintStrong', delay: 1.8 },
  { kind: 'diamond', className: 'left-[46%] top-[22%] size-5 bg-white', delay: 0.3 },
  { kind: 'diamond', className: 'left-[12%] bottom-[20%] size-4 bg-white', delay: 0.9 },
  { kind: 'diamond', className: 'right-[8%] top-[18%] size-5 bg-white', delay: 1.5 },
]

/** Pastel circles float y [0,-15,0] on 4s loops; white diamonds rotate. Decorative. */
export function FloatingShapes({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {SHAPES.map((s, i) => (
        <m.div
          key={i}
          className={cn('absolute', s.className, s.kind === 'circle' ? 'rounded-pill' : 'rounded-sm')}
          animate={reduce ? undefined : s.kind === 'circle' ? { y: [0, -15, 0] } : { y: [0, -15, 0], rotate: [45, 405] }}
          style={s.kind === 'diamond' ? { rotate: 45 } : undefined}
          transition={{
            y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay: s.delay },
            rotate: { duration: 24, repeat: Infinity, ease: 'linear' },
          }}
        />
      ))}
    </div>
  )
}
