import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  ready: boolean
  setSession: (s: Session | null) => void
  setReady: () => void
}

/** In-memory only. Tokens never touch localStorage. */
export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  ready: false,
  setSession: (session) => set({ session }),
  setReady: () => set({ ready: true }),
}))
