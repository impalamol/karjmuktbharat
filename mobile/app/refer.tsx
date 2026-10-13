import { useState } from 'react'
import { Share, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { MotiView } from 'moti'
import { Copy, Share2, Users } from 'lucide-react-native'
import { Screen } from '@/components/Screen'
import { StackHeader } from '@/components/StackHeader'
import { T } from '@/components/T'
import { Pill } from '@/components/Pill'
import { SkeletonBlock } from '@/components/States'
import { useProfile } from '@/lib/api'
import { calculateRegularPerUser } from '@/lib/calculations'
import { formatINR } from '@/lib/format'
import { success } from '@/lib/haptics'
import { colors } from '@/theme/tokens'

const STEPS = [
  ['Share your code', 'Send it to a friend with a home or education loan.'],
  ['They join a block', 'Their loan is verified and they get a seat in a 1,000 member block.'],
  ['Blocks fill faster', 'Full blocks unlock the CSR pool: more extra payments and more rescues for everyone.'],
] as const

export default function Refer() {
  const profile = useProfile()
  const [copied, setCopied] = useState(false)
  const code = profile.data?.referral_code
  const link = code ? `https://karjmuktbharat.com/?ref=${code}` : ''

  const copy = async () => {
    if (!code) return
    await Clipboard.setStringAsync(code)
    success()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const share = () => void Share.share({ message: `Join me on KarjMukt and get up to ${formatINR(calculateRegularPerUser('home'))} extra towards your loan every month. Use my code ${code}: ${link}` })

  return (
    <Screen>
      <StackHeader title="Refer and earn" />
      <MotiView from={{ opacity: 0, translateY: 40 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'spring', damping: 18, stiffness: 140 }} className="overflow-hidden rounded-card bg-beige p-6">
        <View className="absolute -right-8 -top-8 size-32 rounded-full bg-beige-strong" />
        <View className="size-12 items-center justify-center rounded-md bg-paper">
          <Users size={22} color={colors.beige.ink} />
        </View>
        <T variant="small" className="mt-6 text-beige-ink">Your referral code</T>
        {code ? <T variant="amount">{code}</T> : <SkeletonBlock className="mt-2 h-10 w-48" />}
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1">
            <Pill size="md" tone="dark" icon={Copy} iconSide="left" label={copied ? 'Copied' : 'Copy'} onPress={copy} disabled={!code} />
          </View>
          <View className="flex-1">
            <Pill size="md" tone="light" icon={Share2} iconSide="left" label="Share" onPress={share} disabled={!code} />
          </View>
        </View>
      </MotiView>

      <View className="gap-1">
        <T variant="title">How it works</T>
        {STEPS.map(([t, d], i) => (
          <MotiView key={t} from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', delay: 200 + i * 100 }} className="flex-row gap-4 py-3">
            <View className="size-10 items-center justify-center rounded-full bg-ink">
              <T className="font-heavy text-paper">{i + 1}</T>
            </View>
            <View className="flex-1">
              <T variant="label" className="text-base">{t}</T>
              <T variant="small" className="text-sm">{d}</T>
            </View>
          </MotiView>
        ))}
      </View>
    </Screen>
  )
}
