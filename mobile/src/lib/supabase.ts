import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { AppState } from 'react-native'
import { SUPABASE_ANON_KEY, SUPABASE_URL, isDemo } from './env'
import { secureStorage } from './secureStorage'

export const supabase = createClient(isDemo ? 'https://demo.invalid' : SUPABASE_URL, isDemo ? 'demo' : SUPABASE_ANON_KEY, {
  auth: { storage: secureStorage, autoRefreshToken: !isDemo, persistSession: !isDemo, detectSessionInUrl: false },
})

// Refresh tokens only while the app is in the foreground.
if (!isDemo) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh()
    else void supabase.auth.stopAutoRefresh()
  })
}

export class ApiError extends Error {}

/** Calls an Edge Function with the user's JWT. Same contract as the web client. */
export async function callFunction<T = unknown>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (error) throw new ApiError(error.message)
  return data as T
}
