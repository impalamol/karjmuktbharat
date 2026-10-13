import { lazy, Suspense, useMemo } from 'react'
import { Clock, IndianRupee, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SpringCounter } from '@/components/brand/SpringCounter'
import { useT } from '@/i18n'
import { amortize, calculateInterestSaved, calculateRegularPerUser } from '@/lib/calculations'
import { formatCompactINR, formatINR, formatMonths, maskAccount } from '@/lib/format'
import type { Loan } from '@/hooks/queries'
import { ProgressRing } from './ProgressRing'

const TenureChart = lazy(() => import('./TenureChart'))

/** Large bento card: closure ring, interest saved (spring count-up), tenure stats, yearly balance bars. */
export function LoanCard({ loan }: { loan: Loan }) {
  const t = useT()
  const extra = calculateRegularPerUser(loan.loan_type)
  const rate = Number(loan.interest_rate)
  const saving = useMemo(() => calculateInterestSaved(loan.outstanding, rate, loan.emi, extra), [loan.outstanding, rate, loan.emi, extra])
  const yearly = useMemo(() => {
    const before = amortize({ principal: loan.outstanding, annualRatePct: rate, emi: loan.emi }, 0)
    const after = amortize({ principal: loan.outstanding, annualRatePct: rate, emi: loan.emi }, extra)
    const years = Math.ceil((Number.isFinite(before.months) ? before.months : before.series.length - 1) / 12)
    return Array.from({ length: Math.min(years, 30) + 1 }, (_, y) => ({
      year: y,
      withoutKarjmukt: before.series[Math.min(y * 12, before.series.length - 1)]?.balance ?? 0,
      withKarjmukt: after.series[y * 12]?.balance ?? 0,
    }))
  }, [loan.outstanding, rate, loan.emi, extra])
  const closure = loan.sanction_amount > 0 ? ((loan.sanction_amount - loan.outstanding) / loan.sanction_amount) * 100 : 0
  const mo = { yr: t('yr'), mo: t('mo'), never: t('never') }

  return (
    <Card variant="glass" className="h-full">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl">{t('my_loan')}</CardTitle>
          <CardDescription>
            {loan.bank_name} · {maskAccount(loan.loan_account_last4)}
          </CardDescription>
        </div>
        <Badge variant="success">+{formatINR(extra)}{t('card_per_month')}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <ProgressRing value={closure} label={t('outstanding_short')} sublabel={t('loan_closed')} />
          <div className="grid w-full flex-1 grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('outstanding_short')}</p>
              <p className="text-2xl font-bold tabular text-primary">{formatINR(loan.outstanding)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('emi_short')}</p>
              <p className="text-2xl font-bold tabular">{formatINR(loan.emi)}</p>
            </div>
            <div className="col-span-2 rounded-modal bg-gradient-to-r from-accent-50 to-secondary-50 p-4">
              <p className="flex items-center gap-1 text-xs text-accent-700">
                <IndianRupee className="size-3" aria-hidden /> {t('interest_saved')}
              </p>
              {Number.isFinite(saving.interestSaved) ? (
                <SpringCounter value={saving.interestSaved} format={formatINR} className="text-3xl font-bold tabular text-accent-700" />
              ) : (
                <p className="text-sm font-medium text-destructive">{t('never')}</p>
              )}
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-card bg-neutral-100/80 p-3">
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" aria-hidden /> {t('tenure_now')}
            </dt>
            <dd className="text-lg font-semibold tabular">{formatMonths(saving.oldMonths, mo)}</dd>
          </div>
          <div className="rounded-card bg-accent-50 p-3">
            <dt className="flex items-center gap-1 text-xs text-accent-700">
              <TrendingDown className="size-3" aria-hidden /> {t('tenure_new')}
            </dt>
            <dd className="text-lg font-semibold tabular text-accent-700">{formatMonths(saving.newMonths, mo)}</dd>
          </div>
        </dl>
        <Suspense fallback={<Skeleton className="h-56 w-full md:h-64" />}>
          <TenureChart data={yearly} labels={{ without: t('without'), with: t('with'), months: t('yr') }} />
        </Suspense>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-2"><span className="size-3 rounded-pill bg-neutral-300" />{t('without')}</span>
          <span className="flex items-center gap-2"><span className="size-3 rounded-pill bg-accent" />{t('with')}</span>
          <span className="ml-auto text-muted-foreground">{formatCompactINR(loan.sanction_amount)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
