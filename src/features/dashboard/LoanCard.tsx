import { lazy, Suspense, useMemo } from 'react'
import { Clock, IndianRupee, TrendingDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/i18n'
import { buildTenureComparison, calculateInterestSaved, calculateRegularPerUser } from '@/lib/calculations'
import { formatCompactINR, formatINR, formatMonths, maskAccount } from '@/lib/format'
import type { Loan } from '@/hooks/queries'

const TenureChart = lazy(() => import('./TenureChart'))

export function LoanCard({ loan }: { loan: Loan }) {
  const t = useT()
  const extra = calculateRegularPerUser(loan.loan_type)
  const loanInput = { principal: loan.outstanding, annualRatePct: Number(loan.interest_rate), emi: loan.emi }
  const saving = useMemo(() => calculateInterestSaved(loan.outstanding, Number(loan.interest_rate), loan.emi, extra), [loan, extra])
  const series = useMemo(() => buildTenureComparison(loanInput, extra), [loan, extra]) // eslint-disable-line react-hooks/exhaustive-deps
  const mo = { yr: t('yr'), mo: t('mo'), never: t('never') }

  const stats = [
    { label: t('tenure_now'), value: formatMonths(saving.oldMonths, mo), icon: Clock },
    { label: t('tenure_new'), value: formatMonths(saving.newMonths, mo), icon: TrendingDown, good: true },
    { label: t('interest_saved'), value: formatCompactINR(saving.interestSaved), icon: IndianRupee, good: true },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle>{t('my_loan')}</CardTitle>
          <CardDescription>
            {loan.bank_name} · {maskAccount(loan.loan_account_last4)}
          </CardDescription>
        </div>
        <Badge variant="success">+{formatINR(extra)}{t('card_per_month')}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('outstanding_short')}</p>
            <p className="text-2xl font-bold tabular text-primary">{formatINR(loan.outstanding)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('emi_short')}</p>
            <p className="text-2xl font-bold tabular">{formatINR(loan.emi)}</p>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className={s.good ? 'rounded-card bg-accent-50 p-3' : 'rounded-card bg-muted p-3'}>
              <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                <s.icon className="size-3" aria-hidden />
                {s.label}
              </dt>
              <dd className={s.good ? 'text-lg font-semibold tabular text-accent-700' : 'text-lg font-semibold tabular'}>{s.value}</dd>
            </div>
          ))}
        </dl>
        <Suspense fallback={<Skeleton className="h-56 w-full md:h-64" />}>
          <TenureChart data={series} labels={{ without: t('without'), with: t('with'), months: t('months') }} />
        </Suspense>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-2"><span className="size-3 rounded-pill bg-neutral-400" />{t('without')}</span>
          <span className="flex items-center gap-2"><span className="size-3 rounded-pill bg-accent" />{t('with')}</span>
        </div>
      </CardContent>
    </Card>
  )
}
