import { View } from 'react-native'
import { MotiView } from 'moti'
import type { LucideIcon } from 'lucide-react-native'
import { T } from './T'
import { cn } from '@/lib/cn'

/** Transaction-style row: 48px rounded icon square, name + date, bold amount. Fades up with a stagger. */
export function ListRow({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  amount,
  amountClass,
  index = 0,
  dark = false,
}: {
  icon: LucideIcon
  iconBg: string
  iconColor: string
  title: string
  subtitle: string
  amount: string
  amountClass?: string
  index?: number
  dark?: boolean
}) {
  return (
    <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 350, delay: Math.min(index, 10) * 60 }}>
      <View className="flex-row items-center gap-3 py-3">
        <View className="size-12 items-center justify-center rounded-md" style={{ backgroundColor: iconBg }}>
          <Icon size={22} color={iconColor} />
        </View>
        <View className="flex-1">
          <T variant="label" className={dark ? 'text-paper' : undefined} numberOfLines={1}>
            {title}
          </T>
          <T variant="small" numberOfLines={1} className={dark ? 'text-gray-400' : undefined}>
            {subtitle}
          </T>
        </View>
        <T className={cn('font-heavy text-base', dark ? 'text-paper' : 'text-ink', amountClass)}>{amount}</T>
      </View>
    </MotiView>
  )
}
