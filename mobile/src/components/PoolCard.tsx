import { View } from 'react-native'
import { MotiView } from 'moti'
import { T } from './T'
import { Toggle } from './Toggle'
import { cn } from '@/lib/cn'

type Tint = 'mint' | 'beige' | 'sky'
const bg: Record<Tint, string> = { mint: 'bg-mint', beige: 'bg-beige', sky: 'bg-sky' }

/** Card styled like a bank card row: tinted, 24px radius, name, masked number, toggle on the right edge. */
export function PoolCard({
  tint,
  title,
  amount,
  masked,
  meta,
  on,
  onToggle,
  toggleLabel,
  index = 0,
}: {
  tint: Tint
  title: string
  amount: string
  masked: string
  meta: string
  on: boolean
  onToggle: (v: boolean) => void
  toggleLabel: string
  index?: number
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 40 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 140, delay: 150 + index * 100 }}
    >
      <View className={cn('flex-row items-center gap-4 rounded-card p-5', bg[tint])} style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}>
        <View className="flex-1 gap-3">
          <View className="flex-row items-baseline justify-between gap-2">
            <T variant="label">{title}</T>
            <T className="font-heavy text-lg tracking-[-0.3px]">{amount}</T>
          </View>
          <View className="flex-row items-center justify-between">
            <T className="font-semi tracking-[2px] text-gray-700">{masked}</T>
            <T variant="small" className="text-gray-700">
              {meta}
            </T>
          </View>
        </View>
        <View className="h-full w-px bg-black/10" />
        <Toggle value={on} onChange={onToggle} label={toggleLabel} />
      </View>
    </MotiView>
  )
}
