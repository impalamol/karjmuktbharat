import { useEffect, useRef } from 'react'
import { animate, useInView } from 'framer-motion'

/** Counts up to `value` when visible and on every change. Text stays accessible (final value). */
export function AnimatedNumber({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(0)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    const el = ref.current
    if (!el || !inView) return
    const controls = animate(prev.current, value, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        el.textContent = format(Math.round(v))
      },
    })
    prev.current = value
    return () => controls.stop()
  }, [value, inView, format])

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      {format(0)}
    </span>
  )
}
