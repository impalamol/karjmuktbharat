import { StyleSheet, View, type ViewStyle } from 'react-native'
import { MotiView } from 'moti'
import { Easing } from 'react-native-reanimated'
import { colors, motion } from '@/theme/tokens'

interface Shape {
  kind: 'circle' | 'diamond'
  size: number
  color: string
  style: ViewStyle
  delay: number
}

/** Beige, blue and lavender circles plus white diamonds, floating y: [0, -15, 0] on 4s loops. */
const SHAPES: Shape[] = [
  { kind: 'circle', size: 96, color: colors.beige.strong, style: { top: '9%', left: '-6%' }, delay: 0 },
  { kind: 'circle', size: 220, color: colors.sky.strong, style: { top: '26%', right: '-18%' }, delay: 600 },
  { kind: 'circle', size: 64, color: colors.lavender.DEFAULT, style: { top: '52%', left: '10%' }, delay: 1200 },
  { kind: 'diamond', size: 22, color: colors.paper, style: { top: '18%', right: '22%' }, delay: 300 },
  { kind: 'diamond', size: 14, color: colors.paper, style: { top: '46%', left: '46%' }, delay: 900 },
  { kind: 'diamond', size: 18, color: colors.paper, style: { top: '60%', right: '12%' }, delay: 1500 },
]

function Floating({ shape }: { shape: Shape }) {
  const isDiamond = shape.kind === 'diamond'
  return (
    <MotiView
      style={[styles.abs, shape.style]}
      from={{ translateY: 0 }}
      animate={{ translateY: -motion.float.distance }}
      transition={{ type: 'timing', duration: motion.float.duration / 2, delay: shape.delay, loop: true, repeatReverse: true, easing: Easing.inOut(Easing.sin) }}
    >
      <MotiView
        from={{ rotate: '45deg' }}
        animate={{ rotate: isDiamond ? '405deg' : '45deg' }}
        transition={{ type: 'timing', duration: 24_000, loop: true, repeatReverse: false, easing: Easing.linear }}
        style={{ width: shape.size, height: shape.size, borderRadius: isDiamond ? 3 : shape.size / 2, backgroundColor: shape.color }}
      />
    </MotiView>
  )
}

export function FloatingShapes() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {SHAPES.map((s, i) => (
        <Floating key={i} shape={s} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({ abs: { position: 'absolute' } })
