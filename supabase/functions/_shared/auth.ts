import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'
import { HttpError } from './http.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!

/** Service-role client: bypasses RLS. Only use after authorising the caller. */
export const admin: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export interface Caller {
  user: User
  aal: 'aal1' | 'aal2'
  isAdmin: boolean
  jwt: string
}

function decodeClaims(jwt: string): Record<string, unknown> {
  const part = jwt.split('.')[1]
  if (!part) return {}
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)))
}

/** Validates the bearer token with Supabase Auth (signature + expiry + session not revoked). */
export async function requireUser(req: Request): Promise<Caller> {
  const header = req.headers.get('authorization') ?? ''
  const jwt = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!jwt || jwt === ANON) throw new HttpError(401, 'Sign in required', 'unauthenticated')
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await userClient.auth.getUser(jwt)
  if (error || !data.user) throw new HttpError(401, 'Session expired', 'unauthenticated')
  const claims = decodeClaims(jwt)
  const { data: profile } = await admin.from('profiles').select('user_type').eq('id', data.user.id).single()
  return {
    user: data.user,
    aal: claims.aal === 'aal2' ? 'aal2' : 'aal1',
    isAdmin: profile?.user_type === 'admin',
    jwt,
  }
}

export async function requireAdmin(req: Request): Promise<Caller> {
  const c = await requireUser(req)
  if (!c.isAdmin) throw new HttpError(403, 'Admin only', 'forbidden')
  return c
}

/** Sensitive actions (bank change, payouts, draws) require a fresh 2FA (TOTP) session. */
export function requireAal2(c: Caller): void {
  if (c.aal !== 'aal2') throw new HttpError(403, 'Two-factor verification required', 'mfa_required')
}
