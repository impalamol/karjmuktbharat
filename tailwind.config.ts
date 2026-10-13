import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'
import plugin from 'tailwindcss/plugin'
import { colors, typography, spacing, sizes, radius, shadows, breakpoints } from './src/lib/design-tokens'

/**
 * Every value below comes from src/lib/design-tokens.ts.
 * spacing / fontSize / fontWeight / boxShadow / borderRadius are REPLACED (not
 * extended) so off-system values like p-5, shadow-2xl or font-light fail to
 * generate CSS and are caught in review.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
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
        devanagari: [...typography.fontFamily.devanagari],
      },
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        slate: colors.neutral,
        neutral: colors.neutral,
        // shadcn/ui semantic aliases, mapped onto the brand tokens
        background: colors.neutral[50],
        foreground: colors.neutral[900],
        card: { DEFAULT: '#FFFFFF', foreground: colors.neutral[900] },
        popover: { DEFAULT: '#FFFFFF', foreground: colors.neutral[900] },
        muted: { DEFAULT: colors.neutral[100], foreground: colors.neutral[500] },
        border: colors.neutral[200],
        input: colors.neutral[300],
        ring: colors.primary[400],
        destructive: { DEFAULT: colors.semantic.error, foreground: colors.semantic.errorForeground },
        warning: { DEFAULT: colors.semantic.warning, foreground: colors.semantic.warningForeground },
        success: { DEFAULT: colors.semantic.success, foreground: '#FFFFFF' },
      },
      width: sizes,
      height: sizes,
      size: sizes,
      minHeight: { touch: '44px', dvh: '100dvh' },
      minWidth: { touch: '44px' },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [
    animate,
    // `fine:` = mouse / trackpad. Compact controls only there; touch screens of any width keep 44px targets.
    plugin(({ addVariant }) => addVariant('fine', '@media (pointer: fine)')),
  ],
} satisfies Config
