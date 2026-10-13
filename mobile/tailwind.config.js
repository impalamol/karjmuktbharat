const { colors, radius, font } = require('./src/theme/tokens')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      borderRadius: { sm: `${radius.sm}px`, md: `${radius.md}px`, card: `${radius.card}px`, frame: `${radius.frame}px` },
      fontFamily: { body: [font.regular], semi: [font.semibold], heavy: [font.bold] },
    },
  },
  plugins: [],
}
