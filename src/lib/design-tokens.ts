/**
 * KARJMUKTBHARAT design tokens: the single source of truth for the design system.
 *
 * tailwind.config.ts reads these values, so every Tailwind class (bg-primary,
 * text-fluid-base, rounded-card, shadow-sm, p-4 ...) resolves back to this file.
 * Do not hard-code colors, radii, shadows or spacing anywhere else.
 */

export const colors = {
  /** Trust Blue: main CTAs, header */
  primary: {
    DEFAULT: '#0F2C61',
    foreground: '#FFFFFF',
    50: '#EEF3FB',
    100: '#D5E1F5',
    200: '#A9C2EA',
    300: '#7099D8',
    400: '#3B6CBA',
    500: '#1D4A91',
    600: '#163B78',
    700: '#0F2C61',
    800: '#0B2049',
    900: '#071533',
  },
  /** Gold (Diwali / Lakshmi): highlights, success moments */
  secondary: {
    DEFAULT: '#FFB703',
    foreground: '#0F2C61',
    50: '#FFF8E6',
    100: '#FFEDB8',
    500: '#FFB703',
    600: '#E0A000',
    700: '#B37F00',
    /** Gold for TEXT on light backgrounds (6.1:1 on white). #FFB703 itself is only for fills / text on blue. */
    800: '#7A5600',
  },
  /** Success Green */
  accent: {
    DEFAULT: '#059669',
    foreground: '#FFFFFF',
    50: '#ECFDF5',
    100: '#D1FAE5',
    600: '#059669',
    700: '#047857',
  },
  /** Neutral: Slate 50-900 */
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  semantic: {
    error: '#DC2626',
    errorForeground: '#FFFFFF',
    warning: '#F59E0B',
    warningForeground: '#0F172A',
    success: '#059669',
  },
} as const

export const typography = {
  fontFamily: {
    sans: ['Inter', '"Noto Sans Devanagari"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
    devanagari: ['"Noto Sans Devanagari"', 'Inter', 'system-ui', 'sans-serif'],
  },
  /**
   * Type scale 12 / 14 / 16 / 18 / 20 / 24 / 30 / 36 px.
   * Each step is fluid: it grows from its mobile size (at 320px) to its target
   * size (at ~1280px) with clamp(). `base` follows the spec clamp(14px, 2vw, 16px).
   */
  fontSize: {
    xs: ['clamp(0.6875rem, 0.66rem + 0.15vw, 0.75rem)', { lineHeight: '1rem' }], // 11 -> 12
    sm: ['clamp(0.8125rem, 0.79rem + 0.15vw, 0.875rem)', { lineHeight: '1.25rem' }], // 13 -> 14
    base: ['clamp(0.875rem, 2vw, 1rem)', { lineHeight: '1.5rem' }], // 14 -> 16
    lg: ['clamp(1rem, 0.95rem + 0.3vw, 1.125rem)', { lineHeight: '1.75rem' }], // 16 -> 18
    xl: ['clamp(1.125rem, 1.07rem + 0.3vw, 1.25rem)', { lineHeight: '1.75rem' }], // 18 -> 20
    '2xl': ['clamp(1.25rem, 1.15rem + 0.6vw, 1.5rem)', { lineHeight: '2rem' }], // 20 -> 24
    '3xl': ['clamp(1.5rem, 1.3rem + 1vw, 1.875rem)', { lineHeight: '2.25rem' }], // 24 -> 30
    '4xl': ['clamp(1.75rem, 1.45rem + 1.5vw, 2.25rem)', { lineHeight: '2.5rem' }], // 28 -> 36
  },
  /** Only these four weights are allowed. */
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

/** 4px base spacing system: 4, 8, 12, 16, 24, 32, 48, 64 */
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  // Layout-only sizes (sidebar, touch targets, nav). Not used for gaps.
  11: '44px', // minimum touch target
  14: '56px',
  20: '80px',
  70: '280px', // fixed desktop sidebar
} as const

/**
 * Component sizes (width / height / size only, never padding, margin or gap).
 * Kept separate so the spacing scale stays strictly 4/8/12/16/24/32/48/64.
 */
export const sizes = {
  5: '20px', // dot in the block grid
  7: '28px',
  10: '40px',
  24: '96px',
  48: '192px',
  56: '224px', // chart height (mobile)
  64: '256px', // chart / grid height
  80: '320px', // list viewport
} as const

/** 60-30-10 rule: 60% white / slate-50 surfaces, 30% Trust Blue, 10% Gold accents. */
export const colorRatio = { surface: 0.6, primary: 0.3, accent: 0.1 } as const

/** Glassmorphism recipe used by Card variant="glass". */
export const glass = {
  background: 'rgb(255 255 255 / 0.8)',
  border: 'rgb(255 255 255 / 0.2)',
  blur: '24px', // backdrop-blur-xl
} as const

/** Focus ring: blue-500, visible on white and on Trust Blue. */
export const focusRing = '#3B82F6'

export const radius = {
  none: '0px',
  sm: '4px',
  card: '8px',
  modal: '12px',
  pill: '9999px',
} as const

/** Only sm, md, lg shadows exist. */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(15 44 97 / 0.06), 0 1px 3px 0 rgb(15 44 97 / 0.08)',
  md: '0 4px 8px -2px rgb(15 44 97 / 0.10), 0 2px 4px -2px rgb(15 44 97 / 0.06)',
  lg: '0 12px 24px -6px rgb(15 44 97 / 0.16), 0 4px 8px -4px rgb(15 44 97 / 0.08)',
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const layout = {
  sidebarWidth: '280px',
  bottomNavHeight: '64px',
  headerHeight: '56px',
  minTouchTarget: '44px',
  contentMaxWidth: '1440px',
} as const

export const motion = {
  duration: { fast: 0.15, base: 0.3, slow: 0.5, counter: 1.5, mesh: 20 },
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  /** Button press spring from the brief */
  spring: { type: 'spring', stiffness: 400, damping: 17 } as const,
  softSpring: { type: 'spring', stiffness: 120, damping: 20 } as const,
} as const

export const tokens = { colors, colorRatio, glass, focusRing, typography, spacing, sizes, radius, shadows, breakpoints, layout, motion } as const
export default tokens
