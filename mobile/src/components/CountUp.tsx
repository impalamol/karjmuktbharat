import { useEffect, useState } from 'react'
import { runOnJS, useAnimatedReaction, useSharedValue, withSpring } from 'react-native-reanimated'
import { T } from './T'

/** Number that springs from 0 to its value (balance count-up). */
export function CountUp({ value, format, variant = 'amount', className }: { value: number; format: (n: number) => string; variant?: 'amount' | 'hero' | 'title'; className?: string }) {
  const v = useSharedValue(0)
  const [shown, setShown] = useState(format(0))
  useEffect(() => {
    v.value = withSpring(value, { damping: 26, stiffness: 60, mass: 1 })
  }, [value, v])
  useAnimatedReaction(
    () => Math.round(v.value),
    (n, prev) => {
      if (n !== prev) runOnJS(setShown)(format(n))
    },
    [format],
  )
  return (
    <T variant={variant} className={className} accessibilityLabel={format(value)}>
      {shown}
    </T>
  )
}
