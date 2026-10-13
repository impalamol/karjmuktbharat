import type { Transition, Variants } from 'framer-motion'
import { motion as t } from './design-tokens'

/**
 * Shared Framer Motion vocabulary. Components import these instead of inventing
 * their own timings, so every interaction feels like the same product.
 * MotionConfig reducedMotion="user" (App.tsx) turns transforms off for users who ask.
 */

export const spring: Transition = t.spring // stiffness 400, damping 17
export const softSpring: Transition = t.softSpring
export const easeOut: Transition = { duration: t.duration.slow, ease: t.ease }

/** Buttons: whileHover 1.02, whileTap 0.98 with the brief's spring. */
export const buttonMotion = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: spring,
} as const

/** Cards: lift 4px on hover. Shadow and border colour change via CSS classes (300ms). */
export const cardHover = {
  whileHover: { y: -4 },
  transition: { duration: 0.3, ease: 'easeOut' },
} as const

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: easeOut },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: easeOut },
}

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: t.ease } },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 22 } },
}

export const staggerContainer = (stagger = 0.1, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren } },
})

/** Page transition: enter from y 20 / opacity 0, 0.5s easeOut. */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
} as const

/** Wizard steps slide in the direction of travel. */
export const stepSlide: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 26 } },
  exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0, transition: { duration: 0.2 } }),
}

/** Gentle infinite float for hero cards. */
export const float = (delay = 0) => ({
  animate: { y: [0, -10, 0] },
  transition: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay },
})

/** Scroll-reveal props: fade up once when 20% visible. */
export const reveal = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.2 },
} as const
