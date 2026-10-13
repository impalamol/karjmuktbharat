import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { CalendarClock, Clock, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { SpringCounter } from '@/components/brand/SpringCounter'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PageSkeleton } from '@/components/states/Skeletons'
import { BlockGrid } from '@/features/dashboard/BlockGrid'
import { LoanCard } from '@/features/dashboard/LoanCard'
import { LuckyDraw } from '@/features/dashboard/LuckyDraw'
import { MandateCard } from '@/features/dashboard/MandateCard'
import { PaymentTable } from '@/features/dashboard/PaymentTable'
import { RescueWall } from '@/features/dashboard/RescueWall'
import { useMyLoans, usePool, type Loan } from '@/hooks/queries'
import { useProfile } from '@/hooks/useAuth'
import { useT } from '@/i18n'
import { calculateInterestSaved, calculateRegularPerUser } from '@/lib/calculations'
import { celebrate } from '@/lib/confetti'
import { formatDate, formatINR, formatMonths, formatNumber } from '@/lib/format'
import { fadeUp, staggerContainer } from '@/lib/motion'

const SEATS = 1000

/** Fires confetti the first time this browser sees a loan as verified. Stores only the loan id. */
function useVerifiedCelebration(loan?: Loan) {
  const id = loan?.verification_status === 'verified' ? loan.id : null
  useEffect(() => {
    if (!id) return
    const key = `kmb_celebrated_${id}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, '1')
    } catch {
      return
    }
    void celebrate('cannons')
  }, [id])
}

function SmallCard({ icon: Icon, title, children }: { icon: typeof Users; title: string; children: React.ReactNode }) {
  return (
    <Card variant="glass" className="h-full">
      <CardHeader className="flex-row items-center gap-2 pb-2 md:pb-2">
        <span className="flex size-10 items-center justify-center rounded-card bg-primary-50 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  )
}

function BlockFilledCard({ loan }: { loan: Loan }) {
  const t = useT()
  const pool = usePool(loan.loan_type, loan.block_number)
  const users = pool.data?.total_users ?? 0
  return (
    <SmallCard icon={Users} title={t('block_filled')}>
      {pool.isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <>
          <p className="text-2xl font-bold tabular">
            {formatNumber(users)} <span className="text-sm font-medium text-muted-foreground">/ {formatNumber(SEATS)}</span>
          </p>
          <Progress value={(users / SEATS) * 100} shimmer indicatorClassName="bg-gradient-to-r from-primary to-accent" aria-label={t('block_filled')} />
          <p className="text-xs text-muted-foreground">
            {formatNumber(Math.max(0, SEATS - users))} {t('seats_left')}
          </p>
        </>
      )}
    </SmallCard>
  )
}

function nextCreditDate(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), 5)
  if (now.getDate() >= 5) d.setMonth(d.getMonth() + 1)
  return d
}

export default function Dashboard() {
  const t = useT()
  const profile = useProfile()
  const loans = useMyLoans()
  const loan = loans.data?.find((l) => l.verification_status === 'verified') ?? loans.data?.[0]
  useVerifiedCelebration(loan)

  if (loans.isLoading || profile.isLoading) return <PageSkeleton />
  if (loans.isError) return <ErrorState error={loans.error} onRetry={() => loans.refetch()} retrying={loans.isRefetching} />

  const firstName = profile.data?.full_name?.split(' ')[0]
  const verified = loan?.verification_status === 'verified' && !!loan.block_number
  const extra = loan ? calculateRegularPerUser(loan.loan_type) : 0
  const saving = loan ? calculateInterestSaved(loan.outstanding, Number(loan.interest_rate), loan.emi, extra) : null
  const mo = { yr: t('yr'), mo: t('mo'), never: t('never') }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <m.div initial="hidden" animate="show" variants={fadeUp}>
        <p className="text-sm text-muted-foreground">{t('dash_greeting')},</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{firstName ?? t('brand')}</h1>
      </m.div>

      {!loan ? (
        <Card variant="glass">
          <EmptyState
            icon={FileText}
            title={t('empty_title')}
            description={t('how_1_d')}
            action={
              <Button asChild variant="glow">
                <Link to="/onboard">{t('hero_cta')}</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        // Bento: 2 large cards (loan, block) + 4 small cards, 3 columns on desktop.
        <m.div className="grid grid-flow-row-dense gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3" initial="hidden" animate="show" variants={staggerContainer(0.1)}>
          <m.div variants={fadeUp} className="md:col-span-2 lg:row-span-2">
            <LoanCard loan={loan} />
          </m.div>

          {verified ? (
            <m.div variants={fadeUp}>
              <BlockFilledCard loan={loan} />
            </m.div>
          ) : null}
          <m.div variants={fadeUp}>
            <SmallCard icon={CalendarClock} title={t('next_credit')}>
              <p className="text-2xl font-bold tabular text-accent-700">
                <SpringCounter value={extra} format={formatINR} />
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(nextCreditDate().toISOString())} · {t('next_credit_d')}
              </p>
            </SmallCard>
          </m.div>

          {verified ? (
            <m.div variants={fadeUp} className="md:col-span-2 lg:row-span-2">
              <BlockGrid type={loan.loan_type} block={loan.block_number!} />
            </m.div>
          ) : (
            <m.div variants={fadeUp} className="md:col-span-2">
              <Card variant="glass" className="h-full">
                <EmptyState
                  animation={loan.verification_status === 'rejected' ? 'empty' : 'verifying'}
                  title={loan.verification_status === 'rejected' ? t('rejected') : t('verifying')}
                  description={loan.verification_status === 'rejected' ? loan.rejection_reason ?? undefined : t('pending_verification_d')}
                />
              </Card>
            </m.div>
          )}

          <m.div variants={fadeUp}>
            <SmallCard icon={Clock} title={t('months_saved')}>
              <p className="text-2xl font-bold tabular">{saving && Number.isFinite(saving.monthsSaved) ? formatMonths(saving.monthsSaved, mo) : t('never')}</p>
              <p className="text-xs text-muted-foreground">
                {t('tenure_new')}: {saving ? formatMonths(saving.newMonths, mo) : '-'}
              </p>
            </SmallCard>
          </m.div>
          <m.div variants={fadeUp}>
            <MandateCard loan={loan} />
          </m.div>

          <m.div variants={fadeUp} className="md:col-span-2">
            <RescueWall />
          </m.div>
          <m.div variants={fadeUp} className="md:col-span-2 lg:col-span-1">
            <LuckyDraw />
          </m.div>

          <m.div variants={fadeUp} className="md:col-span-2 lg:col-span-3">
            <PaymentTable />
          </m.div>
        </m.div>
      )}
    </div>
  )
}
