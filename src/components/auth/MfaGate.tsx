import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Field } from '@/components/forms/Field'
import { useT } from '@/i18n'
import { supabase } from '@/lib/supabase'
import { totpSchema } from '@/lib/validation'

type Phase = { kind: 'loading' } | { kind: 'enroll'; factorId: string; qr: string; secret: string } | { kind: 'verify'; factorId: string } | { kind: 'ok' }

/**
 * Two-factor gate for sensitive actions (bank change, payouts, draw).
 * Renders `children` only once the session is AAL2. Edge Functions re-check the `aal` claim.
 */
export function MfaGate({ children }: { children: React.ReactNode }) {
  const t = useT()
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [error, setError] = useState<string | null>(null)
  const form = useForm<{ code: string }>({ resolver: zodResolver(totpSchema), defaultValues: { code: '' } })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') return !cancelled && setPhase({ kind: 'ok' })
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp.find((f) => f.status === 'verified')
      if (totp) return !cancelled && setPhase({ kind: 'verify', factorId: totp.id })
      // Clean up half-finished enrolments before starting a new one.
      for (const f of factors?.all ?? []) if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `KarjMukt ${Date.now()}` })
      if (cancelled) return
      if (error || !data) return setError(error?.message ?? t('error_title'))
      setPhase({ kind: 'enroll', factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  if (phase.kind === 'ok') return <>{children}</>
  if (phase.kind === 'loading') return error ? <p role="alert" className="text-sm text-destructive">{error}</p> : <Skeleton className="h-48 w-full" />

  const verify = async ({ code }: { code: string }) => {
    setError(null)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: phase.factorId, code })
    if (error) {
      setError(error.message)
      form.reset({ code: '' })
      return
    }
    setPhase({ kind: 'ok' })
  }

  return (
    <form onSubmit={form.handleSubmit(verify)} className="flex flex-col gap-4" noValidate>
      <div className="flex items-start gap-3">
        <ShieldCheck className="size-6 shrink-0 text-primary" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="font-semibold">{phase.kind === 'enroll' ? t('bank_2fa_enroll') : t('bank_2fa_title')}</p>
          <p className="text-sm text-muted-foreground">{phase.kind === 'enroll' ? t('bank_2fa_enroll_d') : t('bank_2fa_desc')}</p>
        </div>
      </div>
      {phase.kind === 'enroll' && (
        <div className="flex flex-col items-center gap-2">
          <img src={phase.qr} alt="TOTP QR code" className="size-48 rounded-card border border-border bg-card p-2" />
          <code className="break-all rounded-card bg-muted px-2 py-1 text-xs">{phase.secret}</code>
        </div>
      )}
      <Field label={t('bank_2fa_code')} htmlFor="totp" error={form.formState.errors.code?.message}>
        <Input id="totp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center text-xl tracking-widest tabular" autoFocus {...form.register('code')} />
      </Field>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" loading={form.formState.isSubmitting}>
        {t('verify_otp')}
      </Button>
    </form>
  )
}
