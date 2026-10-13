import { useState } from 'react'
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, ArrowRight } from 'lucide-react-native'
import { z } from 'zod'
import { Topography } from '@/components/Topography'
import { IconPill, Pill } from '@/components/Pill'
import { T } from '@/components/T'
import { supabase } from '@/lib/supabase'
import { isDemo } from '@/lib/env'
import { useSession } from '@/stores/session'
import { success, warn } from '@/lib/haptics'

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit Indian mobile number')
const otpSchema = z.string().regex(/^\d{6}$/, 'Enter the 6 digit code')

/** Phone + OTP sign in (Supabase SMS OTP). Same auth as the web app. */
export default function Login() {
  const setUser = useSession((s) => s.setUser)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    const p = phoneSchema.safeParse(phone)
    if (!p.success) return setError(p.error.issues[0]!.message)
    setError(null)
    setBusy(true)
    try {
      if (!isDemo) {
        const { error: e } = await supabase.auth.signInWithOtp({ phone: `+91${phone}` })
        if (e) throw e
      }
      setStep('otp')
    } catch (e) {
      warn()
      setError(e instanceof Error ? e.message : 'Could not send the code')
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    const o = otpSchema.safeParse(otp)
    if (!o.success) return setError(o.error.issues[0]!.message)
    setError(null)
    setBusy(true)
    try {
      if (isDemo) setUser('demo-user')
      else {
        const { data, error: e } = await supabase.auth.verifyOtp({ phone: `+91${phone}`, token: otp, type: 'sms' })
        if (e) throw e
        setUser(data.user?.id ?? null)
      }
      success()
      router.replace('/(tabs)/dashboard')
    } catch (e) {
      warn()
      setError(e instanceof Error ? e.message : 'That code did not work')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View className="flex-1 bg-ink">
      <StatusBar style="light" />
      <Topography opacity={0.12} />
      <SafeAreaView style={{ flex: 1 }}>
        <View className="flex-1 px-6">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-between pb-4">
          <View className="gap-10 pt-2">
            <IconPill icon={ArrowLeft} dark label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <View className="gap-3">
              <T variant="hero" className="text-paper">
                {step === 'phone' ? 'Your mobile number' : 'Enter the code'}
              </T>
              <T className="text-gray-400">{step === 'phone' ? 'We will send a 6 digit code by SMS.' : `Sent to +91 ${phone}`}</T>
            </View>
            {step === 'phone' ? (
              <View className="h-16 flex-row items-center gap-3 rounded-full border border-white/20 bg-white/5 px-6">
                <T className="font-semi text-lg text-paper">+91</T>
                <TextInput
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  placeholder="98765 43210"
                  placeholderTextColor="#6B7280"
                  accessibilityLabel="Mobile number"
                  className="flex-1 font-semi text-lg text-paper"
                />
              </View>
            ) : (
              <TextInput
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                autoComplete="sms-otp"
                textContentType="oneTimeCode"
                placeholder="••••••"
                placeholderTextColor="#6B7280"
                accessibilityLabel="One time code"
                className="h-16 rounded-full border border-white/20 bg-white/5 px-6 text-center font-heavy text-2xl tracking-[12px] text-paper"
              />
            )}
            {error && <T className="text-sm text-red-400">{error}</T>}
            {isDemo && <T variant="small">Demo mode: any valid number and any 6 digits will work.</T>}
          </View>
          <Pill label={busy ? 'Please wait…' : step === 'phone' ? 'Send code' : 'Verify and continue'} tone="light" icon={ArrowRight} disabled={busy} onPress={step === 'phone' ? send : verify} />
        </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </View>
  )
}
