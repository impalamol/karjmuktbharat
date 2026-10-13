import { View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { IconPill } from './Pill'
import { T } from './T'

/** Back button + title for pushed (non-tab) screens. */
export function StackHeader({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <View className="flex-row items-center gap-3 pt-3">
      <IconPill icon={ArrowLeft} dark={dark} label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/dashboard'))} />
      <T variant="title" className={dark ? 'text-paper' : undefined}>{title}</T>
    </View>
  )
}
