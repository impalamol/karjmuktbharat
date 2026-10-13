import { supabase } from './supabase'
import { isDemo } from './env'

/**
 * Raises the session to AAL2 with the member's TOTP code, which update-bank requires.
 * Returns 'no_factor' when the member has not set up an authenticator yet (done on the web app).
 */
export async function verifyTotp(code: string): Promise<'ok' | 'no_factor'> {
  if (isDemo) return 'ok'
  const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal.data?.currentLevel === 'aal2') return 'ok'
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  const factor = data.totp.find((f) => f.status === 'verified')
  if (!factor) return 'no_factor'
  const r = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code })
  if (r.error) throw r.error
  return 'ok'
}
