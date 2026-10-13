import { View } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MotiView } from 'moti'
import { ArrowRight } from 'lucide-react-native'
import { Topography } from '@/components/Topography'
import { FloatingShapes } from '@/components/FloatingShapes'
import { Pill } from '@/components/Pill'
import { Press } from '@/components/Pressable'
import { T } from '@/components/T'
import { useSession } from '@/stores/session'

/** 2x2 dot grid button (opens the app overview). */
function DotGrid({ onPress }: { onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" accessibilityLabel="Explore features">
      <View className="size-14 items-center justify-center gap-1.5 rounded-full border border-white/80">
        {[0, 1].map((r) => (
          <View key={r} className="flex-row gap-1.5">
            <View className="size-2 rounded-full bg-paper" />
            <View className="size-2 rounded-full bg-paper" />
          </View>
        ))}
      </View>
    </Press>
  )
}

/** Onboarding: black, drifting topographic lines, floating pastel shapes, huge Hindi headline. */
export default function Onboarding() {
  const userId = useSession((s) => s.userId)
  const start = () => router.replace(userId ? '/(tabs)/dashboard' : '/login')

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />
      <Topography />
      <FloatingShapes />
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 justify-between px-6 pb-4">
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 600 }} className="flex-row items-center gap-2 pt-2">
          <View className="size-8 items-center justify-center rounded-md bg-mint-strong">
            <T className="font-heavy text-sm">K</T>
          </View>
          <T className="font-heavy text-base text-paper">KarjMukt</T>
        </MotiView>

        <View className="gap-8">
          <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 200 }}>
            <T className="font-heavy text-[52px] leading-[64px] tracking-[-1px] text-paper">कर्ज से मुक्ति, भारत की प्रगति</T>
            <T className="mt-4 text-base text-gray-400">Pool with 1,000 borrowers. Repay faster, and rescue a neighbour every month.</T>
          </MotiView>
          <MotiView from={{ opacity: 0, translateY: 30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 400 }} className="flex-row items-center gap-3">
            <DotGrid onPress={start} />
            <View className="flex-1">
              <Pill label="Get Started" icon={ArrowRight} onPress={start} />
            </View>
          </MotiView>
        </View>
        </View>
      </SafeAreaView>
    </View>
  )
}
