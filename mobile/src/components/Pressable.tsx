import { MotiPressable, type MotiPressableProps } from 'moti/interactions'
import { useMemo } from 'react'
import { tap } from '@/lib/haptics'

/** Every tappable thing: spring scale on press + a light haptic. */
export function Press({ onPress, disabled, children, scaleTo = 0.96, ...props }: MotiPressableProps & { scaleTo?: number }) {
  return (
    <MotiPressable
      disabled={disabled}
      onPress={() => {
        tap()
        onPress?.()
      }}
      animate={useMemo(() => ({ pressed, hovered }: { pressed: boolean; hovered: boolean }) => {
        'worklet'
        return { scale: pressed ? scaleTo : hovered ? 1.02 : 1, opacity: disabled ? 0.5 : 1 }
      }, [scaleTo, disabled])}
      transition={{ type: 'spring', damping: 17, stiffness: 400 }}
      {...props}
    >
      {children}
    </MotiPressable>
  )
}
