import { Link } from 'react-router-dom'
import { Clock, FileText, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { PageSkeleton } from '@/components/states/Skeletons'
import { BlockGrid } from '@/features/dashboard/BlockGrid'
import { LoanCard } from '@/features/dashboard/LoanCard'
import { LuckyDraw } from '@/features/dashboard/LuckyDraw'
import { MandateCard } from '@/features/dashboard/MandateCard'
import { PaymentTable } from '@/features/dashboard/PaymentTable'
import { RescueWall } from '@/features/dashboard/RescueWall'
import { useMyLoans } from '@/hooks/queries'
import { useProfile } from '@/hooks/useAuth'
import { useT } from '@/i18n'

/** Mobile: 1 column · Tablet: 2 columns · Desktop: 3 columns. */
export default function Dashboard() {
  const t = useT()
  const profile = useProfile()
  const loans = useMyLoans()

  if (loans.isLoading || profile.isLoading) return <PageSkeleton />
  if (loans.isError) return <ErrorState error={loans.error} onRetry={() => loans.refetch()} retrying={loans.isRefetching} />

  const loan = loans.data?.find((l) => l.verification_status === 'verified') ?? loans.data?.[0]
  const firstName = profile.data?.full_name?.split(' ')[0]

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <p className="text-sm text-muted-foreground">{t('dash_greeting')},</p>
        <h1 className="text-2xl font-bold tracking-tight">{firstName ?? t('brand')}</h1>
      </div>

      {!loan ? (
        <Card>
          <EmptyState
            icon={FileText}
            title={t('empty_title')}
            description={t('how_1_d')}
            action={
              <Button asChild>
                <Link to="/onboard">{t('hero_cta')}</Link>
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          <div className="md:col-span-2">
            <LoanCard loan={loan} />
          </div>
          <LuckyDraw />

          {loan.verification_status === 'verified' && loan.block_number ? (
            <BlockGrid type={loan.loan_type} block={loan.block_number} />
          ) : (
            <Card className="h-full">
              <EmptyState
                icon={loan.verification_status === 'rejected' ? XCircle : Clock}
                title={loan.verification_status === 'rejected' ? t('rejected') : t('pending_verification')}
                description={loan.verification_status === 'rejected' ? loan.rejection_reason ?? undefined : t('pending_verification_d')}
              />
            </Card>
          )}
          <RescueWall />
          <MandateCard loan={loan} />

          <div className="md:col-span-2 lg:col-span-3">
            <PaymentTable />
          </div>
        </div>
      )}
    </div>
  )
}
