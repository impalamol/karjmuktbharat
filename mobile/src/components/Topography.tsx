import { useMemo } from 'react'
import { StyleSheet, useWindowDimensions } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { MotiView } from 'moti'
import { Easing } from 'react-native-reanimated'

/** Builds contour-like wavy lines: each line is a sum of two sine waves, offset per row. */
function contourPaths(width: number, height: number, lines: number) {
  const paths: string[] = []
  const step = 12
  for (let i = 0; i < lines; i++) {
    const baseY = (height / lines) * i + 20
    const a1 = 18 + (i % 5) * 4
    const a2 = 8 + (i % 3) * 5
    const p1 = i * 0.55
    let d = ''
    for (let x = -40; x <= width * 1.6; x += step) {
      const y = baseY + a1 * Math.sin(x / 90 + p1) + a2 * Math.sin(x / 37 + p1 * 2.3)
      d += `${x === -40 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }
    paths.push(d)
  }
  return paths
}

/** Thin white topographic lines that drift slowly sideways (onboarding background). */
export function Topography({ opacity = 0.22 }: { opacity?: number }) {
  const { width, height } = useWindowDimensions()
  const paths = useMemo(() => contourPaths(width, height, 26), [width, height])
  return (
    <MotiView
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { width: width * 1.6 }]}
      from={{ translateX: 0 }}
      animate={{ translateX: -width * 0.3 }}
      transition={{ type: 'timing', duration: 40_000, loop: true, repeatReverse: true, easing: Easing.inOut(Easing.quad) }}
    >
      <Svg width={width * 1.6} height={height}>
        {paths.map((d, i) => (
          <Path key={i} d={d} stroke="#FFFFFF" strokeOpacity={opacity} strokeWidth={0.8} fill="none" />
        ))}
      </Svg>
    </MotiView>
  )
}
