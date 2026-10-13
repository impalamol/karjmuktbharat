import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useShallow } from 'zustand/react/shallow'
import { supabase, restoreSession } from '@/lib/supabase'
import { isConfigured } from '@/lib/env'
import { useAuthStore } from '@/stores/auth'
import { qk, STALE, queryClient } from '@/lib/queryClient'

export interface Profile {
  id: string
  mobile: string | null
  full_name: string | null
  aadhaar_last4: string | null
  user_type: 'borrower' | 'csr_partner' | 'admin'
  referral_code: string
  preferred_lang: 'en' | 'mr'
  created_at: string
}

/** Boots auth once: restores the session from the httpOnly cookie and subscribes to changes. */
export function useAuthBootstrap() {
  const setSession = useAuthStore((s) => s.setSession)
  const setReady = useAuthStore((s) => s.setReady)
  useEffect(() => {
    if (!isConfigured) {
      setReady()
      return
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'SIGNED_OUT') queryClient.clear()
    })
    restoreSession().finally(setReady)
    return () => sub.subscription.unsubscribe()
  }, [setSession, setReady])
}

export function useSession() {
  return useAuthStore(useShallow((s) => ({ session: s.session, ready: s.ready })))
}

export function useUserId() {
  return useAuthStore((s) => s.session?.user.id ?? null)
}

export function useProfile() {
  const uid = useUserId()
  return useQuery({
    queryKey: qk.profile(uid ?? 'anon'),
    enabled: !!uid,
    staleTime: STALE.static,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, mobile, full_name, aadhaar_last4, user_type, referral_code, preferred_lang, created_at')
        .eq('id', uid!)
        .single()
      if (error) throw error
      return data as Profile
    },
  })
}
