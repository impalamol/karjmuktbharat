import { useState } from 'react'
import { Pressable, View, type LayoutChangeEvent } from 'react-native'
import { MotiView } from 'moti'
import { T } from './T'
import { select } from '@/lib/haptics'
import { cn } from '@/lib/cn'

/** Pill segmented control: dark track, white active pill that springs between options. */
export function Segmented<K extends string>({ options, value, onChange, dark = true }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; dark?: boolean }) {
  const [w, setW] = useState(0)
  const idx = Math.max(0, options.findIndex((o) => o.key === value))
  const seg = w / options.length
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 8)}
      className={cn('h-12 flex-row rounded-full p-1', dark ? 'bg-gray-800' : 'bg-gray-100')}
    >
      {w > 0 && (
        <MotiView
          animate={{ translateX: idx * seg }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{ position: 'absolute', top: 4, left: 4, bottom: 4, width: seg, borderRadius: 999, backgroundColor: dark ? '#FFFFFF' : '#000000' }}
        />
      )}
      {options.map((o) => {
        const active = o.key === value
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              select()
              onChange(o.key)
            }}
            className="flex-1 items-center justify-center"
          >
            <T variant="label" className={active ? (dark ? 'text-ink' : 'text-paper') : dark ? 'text-gray-400' : 'text-gray-500'}>
              {o.label}
            </T>
          </Pressable>
        )
      })}
    </View>
  )
}
