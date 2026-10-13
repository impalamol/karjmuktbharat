import { Pressable } from 'react-native'
import { MotiView } from 'moti'
import { colors } from '@/theme/tokens'
import { select } from '@/lib/haptics'

/** iOS-style switch: 44px track, mint when on, black knob, spring slide. */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={10}
      onPress={() => {
        select()
        onChange(!value)
      }}
    >
      <MotiView
        animate={{ backgroundColor: value ? colors.mint.strong : colors.gray[200] }}
        transition={{ type: 'timing', duration: 200 }}
        style={{ width: 44, height: 26, borderRadius: 13, padding: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <MotiView
          animate={{ translateX: value ? 18 : 0, backgroundColor: value ? colors.ink : colors.paper }}
          transition={{ type: 'spring', damping: 17, stiffness: 400 }}
          style={{ width: 18, height: 18, borderRadius: 9, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}
        />
      </MotiView>
    </Pressable>
  )
}
