import { createClient, type Session } from '@supabase/supabase-js'
import { env } from './env'

/**
 * Session storage policy (no sensitive data in localStorage):
 * - access + refresh tokens live only in this in-memory map;
 * - the refresh token is mirrored into an httpOnly, Secure, SameSite=Strict cookie by /api/auth/session;
 * - on page load /api/auth/refresh swaps that cookie for a fresh session.
 */
const memory = new Map<string, string>()
const memoryStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => void memory.set(k, v),
  removeItem: (k: string) => void memory.delete(k),
}

export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    storage: memoryStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: { params: { eventsPerSecond: 5 } },
  global: { headers: { 'x-client-info': 'karjmuktbharat-web' } },
})

let lastSynced: string | null = null
async function syncCookie(session: Session | null) {
  try {
    if (session?.refresh_token && session.refresh_token !== lastSynced) {
      lastSynced = session.refresh_token
      await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      })
    }
  } catch {
    // Offline: the in-memory session keeps working; the cookie syncs on the next refresh.
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'MFA_CHALLENGE_VERIFIED') void syncCookie(session)
})

/** Restore the session from the httpOnly cookie. Call once on boot. */
export async function restoreSession(): Promise<void> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
    if (!res.ok) return
    const { session } = (await res.json()) as { session: Session | null }
    if (session) {
      lastSynced = session.refresh_token
      await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token })
    }
  } catch {
    /* not signed in or offline */
  }
}

export async function signOut(): Promise<void> {
  const { data } = await supabase.auth.getSession()
  await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {},
  }).catch(() => undefined)
  lastSynced = null
  await supabase.auth.signOut({ scope: 'local' })
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message)
  }
}

/** Calls an Edge Function with the current access token. */
export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body })
  if (error) {
    let code = 'error'
    let message = 'Something went wrong. Please try again.'
    let status = 500
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      status = ctx.status
      const payload = (await ctx.json().catch(() => null)) as { error?: string; message?: string } | null
      code = payload?.error ?? code
      message = payload?.message ?? message
    }
    throw new ApiError(code, message, status)
  }
  return data as T
}

/** Private documents are only ever served through 60-second signed URLs. */
export async function signedDocUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('loan-docs').createSignedUrl(path, 60)
  if (error || !data) throw new ApiError('storage', 'Could not open document', 403)
  return data.signedUrl
}
