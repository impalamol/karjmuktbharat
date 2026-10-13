import { colors } from './design-tokens'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Gold + blue confetti burst. canvas-confetti is loaded only when first needed. */
export async function celebrate(kind: 'burst' | 'cannons' = 'burst'): Promise<void> {
  if (reduced()) return
  const { default: confetti } = await import('canvas-confetti')
  const palette = [colors.secondary.DEFAULT, colors.primary.DEFAULT, colors.accent.DEFAULT, '#FFFFFF']
  if (kind === 'burst') {
    await confetti({ particleCount: 120, spread: 80, startVelocity: 45, origin: { y: 0.6 }, colors: palette, disableForReducedMotion: true })
    return
  }
  const end = Date.now() + 900
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors: palette, disableForReducedMotion: true })
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors: palette, disableForReducedMotion: true })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
