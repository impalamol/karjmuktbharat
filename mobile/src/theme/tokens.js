/**
 * KarjMukt mobile design tokens. Single source for tailwind.config.js (classes) and for
 * SVG / Reanimated code that needs raw values. Dark fintech, abstract shapes, mint accents.
 */
const colors = {
  ink: '#000000',
  paper: '#FFFFFF',
  mint: { DEFAULT: '#CFF5E7', strong: '#A8E6CF', ink: '#0B6B4B' },
  beige: { DEFAULT: '#FFF4D6', strong: '#F5E6C8', ink: '#7A5A12' },
  sky: { DEFAULT: '#D6EFFF', strong: '#C6D8FF', ink: '#1D4E89' },
  lavender: { DEFAULT: '#E2D1F9', ink: '#5B3A8C' },
  gray: { 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280', 700: '#374151', 800: '#1F2937', 900: '#111111' },
  violet: '#6D5DF6',
  blue: '#3B82F6',
  success: '#15803D',
  danger: '#DC2626',
}

/** 4-point grid; radii from the reference (cards 24, phone 32, pills full). */
const radius = { sm: 12, md: 16, card: 24, frame: 32, pill: 9999 }

const font = { regular: 'Inter_500Medium', semibold: 'Inter_600SemiBold', bold: 'Inter_700Bold' }

/** Motion: shared springs and durations (Reanimated / Moti). */
const motion = {
  spring: { damping: 17, stiffness: 400 },
  softSpring: { damping: 18, stiffness: 140 },
  float: { distance: 15, duration: 4000 },
  stagger: 100,
}

module.exports = { colors, radius, font, motion }
