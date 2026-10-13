import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, m } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, Home as HomeIcon, Lock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { FloatingField } from '@/components/forms/FloatingField'
import { OtpLogin } from '@/components/auth/OtpLogin'
import { useSession } from '@/hooks/useAuth'
import { useT, type DictKey } from '@/i18n'
import { callFunction, ApiError } from '@/lib/supabase'
import { calculateInterestSaved, calculateRegularPerUser } from '@/lib/calculations'
import { formatINR, formatMonths } from '@/lib/format'
import { cn } from '@/lib/utils'
import { stepSlide } from '@/lib/motion'
import { celebrate } from '@/lib/confetti'
import { bankSchema, consentSchema, loanSchema, profileSchema, type BankDetails, type LoanDetails, type ProfileDetails } from '@/lib/validation'
import { useOnboardStore } from '@/stores/onboard'

const STEPS: DictKey[] = ['step_mobile', 'step_profile', 'step_loan', 'step_bank', 'step_review']

export default function Onboard() {
  const t = useT()
  const { session, ready } = useSession()
  const step = useOnboardStore((s) => s.step)
  const setStep = useOnboardStore((s) => s.setStep)
  const savedAt = useOnboardStore((s) => s.savedAt)
  const [done, setDone] = useState(false)
  const prevStep = useRef(step)
  const direction = step >= prevStep.current ? 1 : -1
  useEffect(() => {
    prevStep.current = step
  }, [step])

  // Signed in -> skip the mobile step; signed out -> always start at mobile.
  useEffect(() => {
    if (!ready) return
    if (session && step === 0) setStep(1)
    if (!session && step !== 0) setStep(0)
  }, [ready, session, step, setStep])

  if (done) return <Submitted />

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="container flex max-w-2xl flex-col gap-6 py-6 md:py-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{t('onboard_title')}</h1>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {t('step')} {step + 1} {t('of')} {STEPS.length}: {t(STEPS[step]!)}
          </span>
          {savedAt && step > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Save className="size-3" aria-hidden /> {t('draft_saved')}
            </span>
          )}
        </div>
        <Progress value={progress} duration={0.6} shimmer aria-label={`${Math.round(progress)}%`} indicatorClassName="bg-gradient-to-r from-primary to-secondary" className="h-3" />
        <ol className="hidden grid-cols-5 gap-2 sm:grid" aria-hidden>
          {STEPS.map((s, i) => (
            <m.li key={s} animate={{ opacity: i <= step ? 1 : 0.5, y: i === step ? -2 : 0 }} className={cn('text-center text-xs', i <= step ? 'font-semibold text-primary' : 'text-muted-foreground')}>
              {t(s)}
            </m.li>
          ))}
        </ol>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <m.div key={step} custom={direction} variants={stepSlide} initial="enter" animate="center" exit="exit">
          {step === 0 && (
            <StepCard title={t('login_title')}>
              <OtpLogin onSignedIn={() => setStep(1)} />
            </StepCard>
          )}
          {step === 1 && <ProfileStep />}
          {step === 2 && <LoanStep />}
          {step === 3 && <BankStep />}
          {step === 4 && <ReviewStep onDone={() => setDone(true)} />}
        </m.div>
      </AnimatePresence>
    </div>
  )
}

function StepCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card variant="glass" static>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/** Sticky on mobile so the primary action is always reachable. */
function StepActions({ onBack, submitLabel, loading }: { onBack?: () => void; submitLabel: string; loading?: boolean }) {
  const t = useT()
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 flex gap-3 border-t border-border bg-card px-4 py-3 pb-safe md:static md:mx-0 md:border-0 md:p-0">
      {onBack && (
        <Button variant="outline" onClick={onBack} className="flex-1 md:flex-none">
          <ArrowLeft aria-hidden />
          {t('back')}
        </Button>
      )}
      <Button type="submit" loading={loading} className="flex-[2] md:ml-auto md:flex-none">
        {submitLabel}
        {!loading && <ArrowRight aria-hidden />}
      </Button>
    </div>
  )
}

function TextField({ id, label, hint, error, reg, ...rest }: { id: string; label: string; hint?: string; error?: string; reg: UseFormRegisterReturn } & Omit<React.ComponentProps<typeof FloatingField>, 'id' | 'label'>) {
  return <FloatingField id={id} label={label} hint={hint} error={error} {...rest} {...reg} />
}

function ProfileStep() {
  const t = useT()
  const { profile, sensitive, saveProfile, setStep } = useOnboardStore()
  const form = useForm<ProfileDetails>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile.fullName ?? '', aadhaar: sensitive.aadhaar ?? '' },
  })
  const e = form.formState.errors
  return (
    <StepCard title={t('step_profile')}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => {
          saveProfile(v)
          setStep(2)
        })}
      >
        <TextField id="fullName" label={t('full_name')} autoComplete="name" error={e.fullName?.message} reg={form.register('fullName')} />
        <TextField
          id="aadhaar"
          label={t('aadhaar')}
          hint={t('aadhaar_hint')}
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          error={e.aadhaar?.message}
          reg={form.register('aadhaar')}
        />
        <StepActions submitLabel={t('next')} />
      </form>
    </StepCard>
  )
}

function LoanStep() {
  const t = useT()
  const { loan, saveLoan, setStep } = useOnboardStore()
  const form = useForm<LoanDetails>({
    resolver: zodResolver(loanSchema),
    defaultValues: { loanType: loan.loanType ?? 'education', isAuctionCase: loan.isAuctionCase ?? false, ...loan },
  })
  const e = form.formState.errors
  const type = form.watch('loanType')
  const [outstanding, rate, emi] = form.watch(['outstanding', 'interestRate', 'emi'])

  const preview = (() => {
    const o = Number(outstanding)
    const r = Number(rate)
    const em = Number(emi)
    if (!(o > 0 && r >= 0 && em > 0)) return null
    try {
      return calculateInterestSaved(o, r, em, calculateRegularPerUser(type))
    } catch {
      return null
    }
  })()

  return (
    <StepCard title={t('step_loan')}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => {
          saveLoan(v)
          setStep(3)
        })}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t('loan_type')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['education', 'home'] as const).map((lt) => {
              const Icon = lt === 'education' ? GraduationCap : HomeIcon
              const active = type === lt
              return (
                <label
                  key={lt}
                  className={cn(
                    'flex min-h-11 cursor-pointer items-center gap-2 rounded-card border p-3 text-sm font-medium shadow-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    active ? 'border-primary bg-primary-50 text-primary' : 'border-border hover:bg-muted',
                  )}
                >
                  <input type="radio" value={lt} className="sr-only" {...form.register('loanType')} />
                  <Icon className="size-4" aria-hidden />
                  {lt === 'education' ? t('edu_title') : t('home_title')}
                </label>
              )
            })}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="sanctionAmount" label={t('sanction_amount')} inputMode="numeric" error={e.sanctionAmount?.message} reg={form.register('sanctionAmount')} />
          <TextField id="outstanding" label={t('outstanding')} inputMode="numeric" error={e.outstanding?.message} reg={form.register('outstanding')} />
          <TextField id="emi" label={t('emi')} inputMode="numeric" error={e.emi?.message} reg={form.register('emi')} />
          <TextField id="interestRate" label={t('interest_rate')} inputMode="decimal" error={e.interestRate?.message} reg={form.register('interestRate')} />
        </div>
        <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-card border border-border p-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...form.register('isAuctionCase')} />
          <span>{t('auction_case')}</span>
        </label>
        {preview && Number.isFinite(preview.interestSaved) && (
          <div className="flex flex-wrap items-center gap-2 rounded-card bg-accent-50 p-3 text-sm text-accent-700">
            <CheckCircle2 className="size-4" aria-hidden />
            <span>
              {t('interest_saved')}: <strong className="tabular">{formatINR(preview.interestSaved)}</strong> ·{' '}
              {t('months_saved')}: <strong>{formatMonths(preview.monthsSaved, { yr: t('yr'), mo: t('mo'), never: t('never') })}</strong>
            </span>
          </div>
        )}
        <StepActions onBack={() => setStep(1)} submitLabel={t('next')} />
      </form>
    </StepCard>
  )
}

function BankStep() {
  const t = useT()
  const { bank, sensitive, saveBank, setStep } = useOnboardStore()
  const form = useForm<BankDetails>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: bank.bankName ?? '',
      ifsc: bank.ifsc ?? '',
      loanAccount: sensitive.loanAccount ?? '',
      loanAccountConfirm: sensitive.loanAccountConfirm ?? '',
    },
  })
  const e = form.formState.errors
  return (
    <StepCard title={t('step_bank')} description={t('account_hint')}>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((v) => {
          saveBank(v)
          setStep(4)
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="bankName" label={t('bank_name')} autoComplete="off" error={e.bankName?.message} reg={form.register('bankName')} />
          <TextField id="ifsc" label={t('ifsc')} autoComplete="off" maxLength={11} className="uppercase" error={e.ifsc?.message} reg={form.register('ifsc')} />
        </div>
        <TextField id="loanAccount" label={t('loan_account')} autoComplete="off" inputMode="numeric" error={e.loanAccount?.message} reg={form.register('loanAccount')} />
        <TextField
          id="loanAccountConfirm"
          label={t('loan_account_confirm')}
          autoComplete="off"
          inputMode="numeric"
          onPaste={(ev) => ev.preventDefault()}
          error={e.loanAccountConfirm?.message}
          reg={form.register('loanAccountConfirm')}
        />
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden /> AES-256
        </p>
        <StepActions onBack={() => setStep(2)} submitLabel={t('next')} />
      </form>
    </StepCard>
  )
}

function ReviewStep({ onDone }: { onDone: () => void }) {
  const t = useT()
  const qc = useQueryClient()
  const { profile, loan, bank, sensitive, setStep, reset } = useOnboardStore()
  const form = useForm<{ consent: true }>({ resolver: zodResolver(consentSchema) })
  const missingSensitive = !sensitive.aadhaar || !sensitive.loanAccount

  const submit = useMutation({
    mutationFn: () =>
      callFunction<{ loanId: string }>('submit-loan', {
        fullName: profile.fullName,
        aadhaar: sensitive.aadhaar,
        loanType: loan.loanType,
        bankName: bank.bankName,
        ifsc: bank.ifsc,
        loanAccount: sensitive.loanAccount,
        sanctionAmount: loan.sanctionAmount,
        outstanding: loan.outstanding,
        emi: loan.emi,
        interestRate: loan.interestRate,
        isAuctionCase: loan.isAuctionCase ?? false,
        consent: true,
      }),
    onSuccess: () => {
      reset()
      void qc.invalidateQueries({ queryKey: ['loans'] })
      void qc.invalidateQueries({ queryKey: ['profile'] })
      onDone()
    },
  })

  const rows: [string, string][] = [
    [t('full_name'), profile.fullName ?? '—'],
    [t('aadhaar'), sensitive.aadhaar ? `XXXX XXXX ${sensitive.aadhaar.slice(-4)}` : '—'],
    [t('loan_type'), loan.loanType === 'home' ? t('home_title') : t('edu_title')],
    [t('outstanding'), formatINR(Number(loan.outstanding))],
    [t('emi'), formatINR(Number(loan.emi))],
    [t('bank_name'), `${bank.bankName ?? ''} · ${bank.ifsc ?? ''}`],
    [t('loan_account'), sensitive.loanAccount ? `•••• ${sensitive.loanAccount.slice(-4)}` : '—'],
  ]

  return (
    <StepCard title={t('step_review')}>
      <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(() => submit.mutate())}>
        <dl className="divide-y divide-border rounded-card border border-border">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="truncate text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {loan.isAuctionCase && <Badge variant="warning" className="w-fit">{t('auction_case')}</Badge>}
        {missingSensitive && (
          <p role="alert" className="rounded-card bg-secondary-50 p-3 text-sm text-secondary-800">
            {t('aadhaar_hint')} <Button variant="link" className="h-auto p-0" onClick={() => setStep(1)}>{t('back')}</Button>
          </p>
        )}
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...form.register('consent')} />
          <span>{t('consent')}</span>
        </label>
        {form.formState.errors.consent && <p role="alert" className="text-xs text-destructive">{form.formState.errors.consent.message}</p>}
        {submit.isError && (
          <p role="alert" className="text-sm text-destructive">
            {submit.error instanceof ApiError ? submit.error.message : t('error_title')}
          </p>
        )}
        <StepActions onBack={() => setStep(3)} submitLabel={t('submit')} loading={submit.isPending} />
      </form>
    </StepCard>
  )
}

const LottieAnim = lazy(() => import('@/components/brand/LottieAnim'))

function Submitted() {
  const t = useT()
  const navigate = useNavigate()
  useEffect(() => {
    void celebrate('cannons')
  }, [])
  return (
    <div className="container flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <Suspense fallback={<CheckCircle2 className="size-24 text-accent" aria-hidden />}>
        <LottieAnim name="success" loop={false} className="size-24" />
      </Suspense>
      <h1 className="text-2xl font-bold">{t('submitted_title')}</h1>
      <p className="text-muted-foreground">{t('submitted_desc')}</p>
      <Button size="lg" onClick={() => navigate('/dashboard')}>
        {t('go_dashboard')}
      </Button>
      <Link to="/" className="text-sm text-primary underline-offset-4 hover:underline">
        {t('nav_home')}
      </Link>
    </div>
  )
}
