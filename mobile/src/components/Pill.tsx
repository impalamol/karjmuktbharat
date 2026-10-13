import { View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Press } from './Pressable'
import { T } from './T'
import { colors } from '@/theme/tokens'
import { cn } from '@/lib/cn'

type Tone = 'dark' | 'light' | 'outline' | 'mint'

const tones: Record<Tone, { box: string; text: string; icon: string }> = {
  dark: { box: 'bg-ink border border-white/80', text: 'text-paper', icon: colors.paper },
  light: { box: 'bg-paper', text: 'text-ink', icon: colors.ink },
  outline: { box: 'bg-paper border border-gray-200', text: 'text-ink', icon: colors.ink },
  mint: { box: 'bg-mint-strong', text: 'text-ink', icon: colors.ink },
}

/** Pill button: rounded-full, 48-56px tall, optional trailing icon in a circle. */
export function Pill({
  label,
  onPress,
  icon: Icon,
  iconSide = 'right',
  tone = 'dark',
  size = 'lg',
  className,
  disabled,
  accessibilityLabel,
}: {
  label: string
  onPress?: () => void
  icon?: LucideIcon
  iconSide?: 'left' | 'right'
  tone?: Tone
  size?: 'md' | 'lg'
  className?: string
  disabled?: boolean
  accessibilityLabel?: string
}) {
  const t = tones[tone]
  const circle = tone === 'dark' ? 'bg-paper' : 'bg-ink'
  const circleIcon = tone === 'dark' ? colors.ink : colors.paper
  return (
    <Press onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}>
      <View className={cn('flex-row items-center justify-between gap-3 rounded-full px-2', size === 'lg' ? 'h-14' : 'h-12', t.box, className)}>
        {Icon && iconSide === 'left' && (
          <View className={cn('size-10 items-center justify-center rounded-full', circle)}>
            <Icon size={18} color={circleIcon} />
          </View>
        )}
        <T variant="label" className={cn('flex-1 px-3 text-base', Icon && iconSide === 'left' ? 'text-left' : 'text-center', t.text)}>
          {label}
        </T>
        {Icon && iconSide === 'right' && (
          <View className={cn('size-10 items-center justify-center rounded-full', circle)}>
            <Icon size={18} color={circleIcon} />
          </View>
        )}
      </View>
    </Press>
  )
}

/** Small round icon-only pill (back, more, notifications). */
export function IconPill({ icon: Icon, onPress, label, dark = false }: { icon: LucideIcon; onPress?: () => void; label: string; dark?: boolean }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View className={cn('size-12 items-center justify-center rounded-full border', dark ? 'border-white/20 bg-white/10' : 'border-gray-200 bg-paper')}>
        <Icon size={20} color={dark ? colors.paper : colors.ink} />
      </View>
    </Press>
  )
}

/** Tiny status chip (+10.5%, 6 Varsha Vachle). */
export function Chip({ label, tone = 'gray' }: { label: string; tone?: 'green' | 'gray' | 'dark' }) {
  const box = tone === 'green' ? 'bg-mint' : tone === 'dark' ? 'bg-white/10' : 'bg-gray-100'
  const text = tone === 'green' ? 'text-mint-ink' : tone === 'dark' ? 'text-paper' : 'text-gray-700'
  return (
    <View className={cn('rounded-full px-3 py-1.5', box)}>
      <T variant="small" className={cn('font-semi', text)}>
        {label}
      </T>
    </View>
  )
}
