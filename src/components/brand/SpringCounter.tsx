import { useEffect, useRef } from 'react'
import { useInView, useMotionValueEvent, useSpring, useTransform } from 'framer-motion'

/**
 * Counts up with spring physics (useSpring + useTransform) once it scrolls into view,
 * and springs to new values on every live update. Screen readers get the final value.
 */
export function SpringCounter({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const spring = useSpring(0, { stiffness: 50, damping: 20, mass: 1 })
  const display = useTransform(spring, (v) => format(Math.round(v)))

  useEffect(() => {
    if (inView) spring.set(value)
  }, [inView, value, spring])

  useMotionValueEvent(display, 'change', (v) => {
    if (ref.current) ref.current.textContent = v
  })

  return (
    <span className={className}>
      <span ref={ref} aria-hidden>
        {format(0)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
