import { describe, expect, it } from 'vitest'
import { colors, darkColors, surfaces } from './design-tokens'

/** WCAG 2.1 relative luminance and contrast ratio. */
const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

const WHITE = '#FFFFFF'
// [name, text, background] for every text/background pairing the UI uses.
const pairs: [string, string, string][] = [
  ['body text', colors.neutral[900], WHITE],
  ['muted text on white', colors.neutral[500], WHITE],
  ['muted text on page bg', colors.neutral[500], colors.neutral[50]],
  ['primary button', colors.primary.foreground, colors.primary.DEFAULT],
  ['primary text on white', colors.primary.DEFAULT, WHITE],
  ['link / focus text', colors.primary[500], WHITE],
  ['gold button', colors.secondary.foreground, colors.secondary.DEFAULT],
  ['gold text on white', colors.secondary[800], WHITE],
  ['gold text on blue', colors.secondary.DEFAULT, colors.primary.DEFAULT],
  ['light text on blue card', colors.primary[100], colors.primary.DEFAULT],
  ['success button', colors.accent.foreground, colors.accent[700]],
  ['green text on green tint', colors.accent[700], colors.accent[50]],
  ['error text', colors.semantic.error, WHITE],
  ['error button', colors.semantic.errorForeground, colors.semantic.error],
]

describe('WCAG AA contrast (4.5:1 for normal text)', () => {
  it.each(pairs)('%s', (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })
})

const D = darkColors
const BG = surfaces.dark.background
const CARD = surfaces.dark.card
const darkPairs: [string, string, string][] = [
  ['body text', D.neutral[900], BG],
  ['muted text on page', D.neutral[500], BG],
  ['muted text on card', D.neutral[500], CARD],
  ['primary (white) button', D.primary.foreground, D.primary.DEFAULT],
  ['primary text on card', D.primary.DEFAULT, CARD],
  ['primary text on primary tint', D.primary.DEFAULT, D.primary[50]],
  ['gold button', D.secondary.foreground, D.secondary.DEFAULT],
  ['gold text on card', D.secondary[800], CARD],
  ['success button', D.accent.foreground, D.accent[700]],
  ['green text on green tint', D.accent[700], D.accent[50]],
  ['error text', D.semantic.error, CARD],
]

describe('WCAG AA contrast in the dark theme', () => {
  it.each(darkPairs)('%s', (_, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })
})
