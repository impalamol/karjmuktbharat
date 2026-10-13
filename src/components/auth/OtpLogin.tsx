import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/forms/Field'
import { useT } from '@/i18n'
import { supabase } from '@/lib/supabase'
import { mobileSchema, otpSchema } from '@/lib/validation'
import { isConfigured } from '@/lib/env'

type MobileForm = { mobile: string }
type OtpForm = { otp: string }

/** Mobile OTP sign-in. Rate limit (3 per 10 min) is enforced server-side by the send-sms hook. */
export function OtpLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const t = useT()
  const [phone, setPhone] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [serverError, setServerError] = useState<string | null>(null)

  const mobileForm = useForm<MobileForm>({ resolver: zodResolver(mobileSchema), defaultValues: { mobile: '' } })
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema), defaultValues: { otp: '' } })

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const sendOtp = async (mobile: string) => {
    setServerError(null)
    const e164 = `+91${mobile}`
    const { error } = await supabase.auth.signInWithOtp({ phone: e164, options: { shouldCreateUser: true, channel: 'sms' } })
    if (error) {
      setServerError(error.status === 429 ? t('otp_limit') : error.message)
      return
    }
    setPhone(e164)
    setCooldown(60)
  }

  const verify = async ({ otp }: OtpForm) => {
    setServerError(null)
    const { error } = await supabase.auth.verifyOtp({ phone: phone!, token: otp, type: 'sms' })
    if (error) {
      setServerError(error.message)
      otpForm.reset({ otp: '' })
      return
    }
    onSignedIn()
  }

  if (!phone) {
    return (
      <form onSubmit={mobileForm.handleSubmit(({ mobile }) => sendOtp(mobile))} className="flex flex-col gap-4" noValidate>
        <Field label={t('mobile_label')} hint={t('mobile_hint')} error={mobileForm.formState.errors.mobile?.message} htmlFor="mobile">
          <div className="flex items-stretch gap-2">
            <span className="inline-flex h-11 items-center rounded-card border border-input bg-muted px-3 text-sm font-medium">+91</span>
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={14}
              placeholder="98765 43210"
              aria-invalid={!!mobileForm.formState.errors.mobile}
              {...mobileForm.register('mobile')}
            />
          </div>
        </Field>
        {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
        <Button type="submit" size="lg" loading={mobileForm.formState.isSubmitting} disabled={!isConfigured}>
          <Smartphone aria-hidden />
          {t('send_otp')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('otp_limit')}</p>
      </form>
    )
  }

  return (
    <form onSubmit={otpForm.handleSubmit(verify)} className="flex flex-col gap-4" noValidate>
      <Field label={`${t('otp_label')} (${phone})`} error={otpForm.formState.errors.otp?.message} htmlFor="otp">
        <Input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className="text-center text-xl font-semibold tracking-widest tabular"
          aria-invalid={!!otpForm.formState.errors.otp}
          autoFocus
          {...otpForm.register('otp')}
        />
      </Field>
      {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" size="lg" loading={otpForm.formState.isSubmitting}>
        {t('verify_otp')}
      </Button>
      <Button variant="link" disabled={cooldown > 0} onClick={() => sendOtp(phone.slice(3))}>
        {t('resend_otp')} {cooldown > 0 && `(${cooldown}s)`}
      </Button>
    </form>
  )
}
