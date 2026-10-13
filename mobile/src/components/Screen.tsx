import type { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { MotiView } from 'moti'
import { cn } from '@/lib/cn'

/**
 * Page wrapper. `dark` = pure black (onboarding, analytics); light = white with the
 * black status bar strip from the reference. Content fades up on mount.
 */
export function Screen({ children, dark = false, scroll = true, className, bottomInset = true }: { children: ReactNode; dark?: boolean; scroll?: boolean; className?: string; bottomInset?: boolean }) {
  const body = (
    <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500 }} className={cn('flex-1 gap-6 px-5 pt-2', bottomInset && 'pb-32', className)}>
      {children}
    </MotiView>
  )
  return (
    <View className={cn('flex-1', dark ? 'bg-ink' : 'bg-ink')}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }} />
      <View className={cn('flex-1 overflow-hidden', dark ? 'bg-ink' : 'rounded-t-frame bg-paper')}>
        {scroll ? (
          <ScrollView contentContainerClassName="grow" showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          body
        )}
      </View>
    </View>
  )
}
