import { create } from 'zustand'
import { isDemo } from '@/lib/env'

interface SessionState {
  /** Supabase user id, or the demo user in demo mode. Never persisted here: the token lives in SecureStore. */
  userId: string | null
  /** True once the user has passed Face ID / fingerprint this launch. */
  unlocked: boolean
  setUser: (id: string | null) => void
  setUnlocked: (v: boolean) => void
}

export const useSession = create<SessionState>((set) => ({
  userId: null,
  unlocked: isDemo,
  setUser: (userId) => set({ userId }),
  setUnlocked: (unlocked) => set({ unlocked }),
}))
