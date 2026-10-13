import { ActivityIndicator, View } from 'react-native'
import { MotiView } from 'moti'
import { T } from './T'
import { Pill } from './Pill'

export function Loading({ dark = false }: { dark?: boolean }) {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <ActivityIndicator color={dark ? '#FFFFFF' : '#000000'} />
    </View>
  )
}

/** Shimmer-free skeleton: soft pulsing block. */
export function SkeletonBlock({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <MotiView
      from={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 800, loop: true, repeatReverse: true }}
      className={`rounded-card ${dark ? 'bg-gray-800' : 'bg-gray-100'} ${className ?? ''}`}
    />
  )
}

export function ErrorView({ error, onRetry, dark = false }: { error: unknown; onRetry: () => void; dark?: boolean }) {
  return (
    <View className="items-center gap-4 p-8">
      <T variant="title" className={dark ? 'text-paper' : undefined}>
        Something went wrong
      </T>
      <T variant="small" className="text-center">
        {error instanceof Error ? error.message : 'Please check your connection and try again.'}
      </T>
      <Pill label="Try again" tone={dark ? 'light' : 'dark'} size="md" onPress={onRetry} />
    </View>
  )
}

export function Empty({ title, body, dark = false }: { title: string; body: string; dark?: boolean }) {
  return (
    <View className="items-center gap-2 p-8">
      <T variant="label" className={dark ? 'text-paper' : undefined}>
        {title}
      </T>
      <T variant="small" className="text-center">
        {body}
      </T>
    </View>
  )
}
