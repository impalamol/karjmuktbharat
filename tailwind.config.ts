import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin'
import { colors, darkColors, pastel, surfaces, typography, spacing, sizes, radius, shadows, breakpoints, focusRing } from './src/lib/design-tokens'

type Palette = typeof colors | typeof darkColors
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ')
const SCALES = ['primary', 'secondary', 'accent', 'neutral'] as const

/** CSS variables (space-separated RGB channels so `bg-primary/80` still works) for one theme. */
function themeVars(c: Palette, surface: (typeof surfaces)[keyof typeof surfaces], shadow: string) {
  const vars: Record<string, string> = {}
  for (const name of SCALES) for (const [k, v] of Object.entries(c[name])) vars[`--${name}-${k}`] = rgb(v)
  for (const [k, v] of Object.entries(c.semantic)) vars[`--${k}`] = rgb(v)
  for (const [k, v] of Object.entries(surface)) vars[`--${k}`] = rgb(v)
  vars['--shadow'] = shadow
  return vars
}
/** `primary` -> { DEFAULT: 'rgb(var(--primary-DEFAULT) / <alpha-value>)', 50: ... } */
const scale = (name: (typeof SCALES)[number]) =>
  Object.fromEntries(Object.keys(colors[name]).map((k) => [k, `rgb(var(--${name}-${k}) / <alpha-value>)`]))
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

/**
 * Colours are CSS variables: light values on :root, dark values on .dark.
 * Every value below comes from src/lib/design-tokens.ts.
 * spacing / fontSize / fontWeight / boxShadow / borderRadius are REPLACED (not
 * extended) so off-system values like p-5, shadow-2xl or font-light fail to
 * generate CSS and are caught in review.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    screens: breakpoints,
    spacing,
    fontSize: typography.fontSize as unknown as Record<string, [string, { lineHeight: string }]>,
    fontWeight: typography.fontWeight,
    borderRadius: {
      ...radius,
      DEFAULT: radius.card,
      md: radius.card,
      lg: radius.modal,
      full: radius.pill,
    },
    boxShadow: shadows,
    container: {
      center: true,
      padding: { DEFAULT: '16px', md: '24px', xl: '32px' },
      screens: { '2xl': '1440px' },
    },
    extend: {
      fontFamily: {
        sans: [...typography.fontFamily.sans],
        display: [...typography.fontFamily.display],
      },
      colors: {
        primary: scale('primary'),
        secondary: scale('secondary'),
        accent: scale('accent'),
        slate: scale('neutral'),
        neutral: scale('neutral'),
        // shadcn/ui semantic aliases
        background: v('background'),
        foreground: v('neutral-900'),
        card: { DEFAULT: v('card'), foreground: v('neutral-900') },
        popover: { DEFAULT: v('card'), foreground: v('neutral-900') },
        glass: v('glass'),
        muted: { DEFAULT: v('neutral-100'), foreground: v('neutral-500') },
        border: v('border'),
        input: v('input'),
        ring: focusRing,
        destructive: { DEFAULT: v('error'), foreground: v('errorForeground') },
        warning: { DEFAULT: v('warning'), foreground: v('warningForeground') },
        success: { DEFAULT: v('success'), foreground: v('accent-foreground') },
        pastel,
      },
      width: sizes,
      height: sizes,
      size: sizes,
      minHeight: { touch: '44px', dvh: '100dvh' },
      minWidth: { touch: '44px' },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'gold-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(255 183 3 / 0)' },
          '50%': { boxShadow: '0 0 0 6px rgb(255 183 3 / 0.35)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.3s ease-out',
        'accordion-up': 'accordion-up 0.3s ease-out',
        shimmer: 'shimmer 1.5s infinite',
        'gold-glow': 'gold-glow 1.6s ease-in-out 3',
      },
    },
  },
  plugins: [
    animate,
    plugin(({ addBase }) =>
      addBase({
        ':root': { ...themeVars(colors, surfaces.light, '15 44 97'), colorScheme: 'light' },
        '.dark': { ...themeVars(darkColors, surfaces.dark, '0 0 0'), colorScheme: 'dark' },
      }),
    ),
    // `fine:` = mouse / trackpad. Compact controls only there; touch screens of any width keep 44px targets.
    plugin(({ addVariant }) => addVariant('fine', '@media (pointer: fine)')),
  ],
} satisfies Config
