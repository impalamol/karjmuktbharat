import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Landmark, LayoutGrid, LifeBuoy, ScanLine, UserRound, type LucideIcon } from 'lucide-react-native'
import { Press } from './Pressable'
import { T } from './T'
import { colors } from '@/theme/tokens'

const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  dashboard: { icon: LayoutGrid, label: 'Dashboard' },
  rescue: { icon: LifeBuoy, label: 'Rescue' },
  add: { icon: ScanLine, label: 'Check UTR' },
  bank: { icon: Landmark, label: 'Bank' },
  profile: { icon: UserRound, label: 'Profile' },
}

/** White floating tab bar; the centre tab is a raised violet-to-blue circle (UTR scanner). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) }}>
      <View
        className="h-[68px] flex-row items-center justify-around rounded-full border border-gray-200 bg-paper px-2"
        style={{ shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 }}
      >
        {state.routes.map((route, i) => {
          const meta = ICONS[route.name]
          if (!meta) return null
          const focused = state.index === i
          const onPress = () => {
            const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !e.defaultPrevented) navigation.navigate(route.name)
          }
          const Icon = meta.icon
          if (route.name === 'add') {
            return (
              <Press key={route.key} onPress={onPress} accessibilityRole="button" accessibilityLabel={meta.label} scaleTo={0.9}>
                <LinearGradient colors={[colors.violet, colors.blue]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 60, height: 60, borderRadius: 30, marginTop: -28, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.paper }}>
                  <Icon size={24} color={colors.paper} />
                </LinearGradient>
              </Press>
            )
          }
          return (
            <Press key={route.key} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={meta.label}>
              <View className="w-14 items-center gap-1 py-2">
                <Icon size={22} color={focused ? colors.ink : colors.gray[400]} strokeWidth={focused ? 2.4 : 2} />
                <T className={`text-[10px] ${focused ? 'font-heavy text-ink' : 'font-body text-gray-400'}`}>{meta.label}</T>
                <MotiView animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 0 }} transition={{ type: 'spring', damping: 17, stiffness: 400 }} className="absolute -bottom-0.5 size-1 rounded-full bg-ink" />
              </View>
            </Press>
          )
        })}
      </View>
    </View>
  )
}
