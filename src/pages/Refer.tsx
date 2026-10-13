import { useState } from 'react'
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CardSkeleton } from '@/components/states/Skeletons'
import { ErrorState } from '@/components/states/ErrorState'
import { useMyLoans, usePool } from '@/hooks/queries'
import { useProfile } from '@/hooks/useAuth'
import { useT } from '@/i18n'
import { env } from '@/lib/env'
import { calculateRegularPerUser } from '@/lib/calculations'
import { formatINR, formatNumber } from '@/lib/format'

export default function Refer() {
  const t = useT()
  const profile = useProfile()
  const loans = useMyLoans()
  const loan = loans.data?.find((l) => l.verification_status === 'verified')
  const pool = usePool(loan?.loan_type, loan?.block_number)
  const [copied, setCopied] = useState(false)

  if (profile.isLoading) return <CardSkeleton />
  if (profile.isError || !profile.data) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />

  const link = `${env.VITE_SITE_URL}/onboard?ref=${encodeURIComponent(profile.data.referral_code)}`
  const message = `${t('refer_message')} ${link}`
  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`
  const filled = pool.data?.total_users ?? 0

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'KARJMUKTBHARAT', text: t('refer_message'), url: link }).catch(() => undefined)
    } else {
      window.open(wa, '_blank', 'noopener,noreferrer')
    }
  }
  const copy = async () => {
    await navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 md:gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t('refer_title')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t('refer_code')}</CardTitle>
          <CardDescription>{t('refer_d')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 rounded-card border border-dashed border-primary-300 bg-primary-50 p-4">
            <span className="font-mono text-2xl font-bold tracking-widest text-primary">{profile.data.referral_code}</span>
            <Button variant="ghost" size="icon" onClick={copy} aria-label={t('refer_copy')}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            </Button>
          </div>
          {loan?.block_number && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>{t('block')} #{loan.block_number}</span>
                <span className="tabular">{formatNumber(filled)}/1,000</span>
              </div>
              <Progress value={filled / 10} indicatorClassName="bg-secondary" />
              <p className="text-xs text-muted-foreground">
                {t('card_you_get')}: {formatINR(calculateRegularPerUser(loan.loan_type))}{t('card_per_month')}
              </p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="success" size="lg">
              <a href={wa} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden /> {t('refer_whatsapp')}
              </a>
            </Button>
            <Button variant="outline" size="lg" onClick={share}>
              <Share2 aria-hidden /> {copied ? t('refer_copied') : t('refer_copy')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
