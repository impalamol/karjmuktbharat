import { colors, darkColors } from './design-tokens'
import { useUiStore } from '@/stores/ui'

/** Hex palette for the active theme, for places CSS classes can't reach (SVG attributes, Recharts). */
export function useThemeColors() {
  const theme = useUiStore((s) => s.theme)
  return theme === 'dark' ? darkColors : colors
}
