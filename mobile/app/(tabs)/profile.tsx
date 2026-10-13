import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router, type Href } from 'expo-router'
import { ChevronRight, Fingerprint, Gift, LogOut, ReceiptText, ShieldCheck, type LucideIcon } from 'lucide-react-native'
import { Screen } from '@/components/Screen'
import { T } from '@/components/T'
import { Pill } from '@/components/Pill'
import { Press } from '@/components/Pressable'
import { Toggle } from '@/components/Toggle'
import { useProfile } from '@/lib/api'
import { biometricAvailable, confirmWithBiometrics, getBiometricLock, setBiometricLock } from '@/lib/biometrics'
import { supabase } from '@/lib/supabase'
import { isDemo } from '@/lib/env'
import { useSession } from '@/stores/session'
import { colors } from '@/theme/tokens'

function LinkRow({ icon: Icon, bg, fg, label, href }: { icon: LucideIcon; bg: string; fg: string; label: string; href: Href<string> }) {
  return (
    <Press onPress={() => router.push(href)} accessibilityRole="link" accessibilityLabel={label}>
      <View className="flex-row items-center gap-3 py-3">
        <View className="size-12 items-center justify-center rounded-md" style={{ backgroundColor: bg }}>
          <Icon size={22} color={fg} />
        </View>
        <T variant="label" className="flex-1 text-base">{label}</T>
        <ChevronRight size={20} color={colors.gray[400]} />
      </View>
    </Press>
  )
}

export default function Profile() {
  const profile = useProfile()
  const setUser = useSession((s) => s.setUser)
  const [lock, setLock] = useState(false)
  const [hasBio, setHasBio] = useState(false)
  const p = profile.data

  useEffect(() => {
    void biometricAvailable().then(setHasBio)
    void getBiometricLock().then(setLock)
  }, [])

  const toggleLock = async (on: boolean) => {
    if (on && !(await confirmWithBiometrics('Turn on app lock'))) return
    await setBiometricLock(on)
    setLock(on)
  }

  const signOut = async () => {
    if (!isDemo) await supabase.auth.signOut()
    setUser(null)
    router.replace('/')
  }

  return (
    <Screen>
      <View className="items-center gap-3 pt-6">
        <View className="size-24 items-center justify-center rounded-full bg-lavender">
          <T className="font-heavy text-3xl text-lavender-ink">{(p?.full_name ?? 'K').slice(0, 1)}</T>
        </View>
        <T variant="title">{p?.full_name ?? ' '}</T>
        <T variant="small">{p ? `${p.mobile.replace(/(\+91)(\d{5})(\d{5})/, '$1 $2 $3')} · Aadhaar ••••${p.aadhaar_last4 ?? '----'}` : ' '}</T>
      </View>

      <View className="rounded-card bg-gray-100 px-4 py-2">
        <View className="flex-row items-center gap-3 py-3">
          <View className="size-12 items-center justify-center rounded-md bg-mint">
            <Fingerprint size={22} color={colors.mint.ink} />
          </View>
          <View className="flex-1">
            <T variant="label" className="text-base">Face ID / fingerprint lock</T>
            <T variant="small">{hasBio ? 'Ask on every launch' : 'Not available on this device'}</T>
          </View>
          <Toggle value={lock} onChange={(v) => void toggleLock(v)} label="Biometric app lock" />
        </View>
      </View>

      <View className="rounded-card bg-gray-100 px-4 py-2">
        <LinkRow icon={Gift} bg={colors.beige.strong} fg={colors.beige.ink} label="Refer and earn" href="/refer" />
        <LinkRow icon={ReceiptText} bg={colors.sky.DEFAULT} fg={colors.sky.ink} label="Transactions" href="/transactions" />
        {p?.user_type === 'admin' && <LinkRow icon={ShieldCheck} bg={colors.lavender.DEFAULT} fg={colors.lavender.ink} label="Admin: verify loans" href="/admin" />}
      </View>

      <Pill label="Sign out" tone="outline" icon={LogOut} iconSide="left" onPress={signOut} />
      <T variant="small" className="text-center">KarjMukt · Karj Se Mukti, Bharat Ki Pragati</T>
    </Screen>
  )
}
