import '../global.css'
import { useEffect, useState } from 'react'
import { AppState, View } from 'react-native'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
// Per-weight imports so only the three weights we use are bundled.
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold'
import { Fingerprint } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'
import { isDemo } from '@/lib/env'
import { useSession } from '@/stores/session'
import { confirmWithBiometrics, getBiometricLock } from '@/lib/biometrics'
import { Pill } from '@/components/Pill'
import { T } from '@/components/T'
import { Topography } from '@/components/Topography'

void SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } },
})

// TanStack Query refetches on app foreground instead of window focus.
AppState.addEventListener('change', (s) => focusManager.setFocused(s === 'active'))

/** Keeps the session store in sync with Supabase auth (token itself stays in SecureStore). */
function useAuthListener() {
  const setUser = useSession((s) => s.setUser)
  const [ready, setReady] = useState(isDemo)
  useEffect(() => {
    if (isDemo) {
      setUser('demo-user')
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user.id ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user.id ?? null)
      if (!session) queryClient.clear()
    })
    return () => data.subscription.unsubscribe()
  }, [setUser])
  return ready
}

/** Face ID / fingerprint gate shown on launch when the member turned the lock on. */
function LockGate() {
  const setUnlocked = useSession((s) => s.setUnlocked)
  const unlock = async () => {
    if (await confirmWithBiometrics('Unlock KarjMukt')) setUnlocked(true)
  }
  useEffect(() => {
    void unlock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-ink px-8">
      <Topography />
      <View className="size-20 items-center justify-center rounded-full bg-mint-strong">
        <Fingerprint size={36} color="#000" />
      </View>
      <T variant="title" className="text-paper">
        KarjMukt is locked
      </T>
      <Pill label="Unlock" tone="light" onPress={unlock} className="w-56" />
    </View>
  )
}

export default function RootLayout() {
  // The single-file web preview ships Inter as inline @font-face rules, so it skips the asset loader.
  const [fontsLoaded, fontError] = useFonts(process.env.EXPO_PUBLIC_INLINE_FONTS ? {} : { Inter_500Medium, Inter_600SemiBold, Inter_700Bold })
  const authReady = useAuthListener()
  const unlocked = useSession((s) => s.unlocked)
  const setUnlocked = useSession((s) => s.setUnlocked)
  const [lockChecked, setLockChecked] = useState(isDemo)

  useEffect(() => {
    if (isDemo) return
    void getBiometricLock().then((on) => {
      if (!on) setUnlocked(true)
      setLockChecked(true)
    })
  }, [setUnlocked])

  // A font that fails to load falls back to the system font rather than blocking the app.
  const ready = (fontsLoaded || !!fontError) && authReady && lockChecked
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])
  if (!ready) return null

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {unlocked ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' }, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        ) : (
          <LockGate />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
