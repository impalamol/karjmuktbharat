import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMandate, type Loan } from '@/hooks/queries'
import { useT } from '@/i18n'
import { calculateBlockBreakdown } from '@/lib/calculations'
import { env } from '@/lib/env'
import { formatINR } from '@/lib/format'
import { qk } from '@/lib/queryClient'
import { callFunction } from '@/lib/supabase'

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void }
  }
}

function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Razorpay'))
    document.head.appendChild(s)
  })
}

/** Razorpay eMandate (test mode) for the monthly borrower contribution. */
export function MandateCard({ loan }: { loan: Loan }) {
  const t = useT()
  const qc = useQueryClient()
  const mandate = useMandate(loan.id)
  const monthly = calculateBlockBreakdown(loan.loan_type).borrowerContributionPerUser
  const active = mandate.data && ['authorized', 'confirmed'].includes(mandate.data.status)

  const setup = useMutation({
    mutationFn: async () => {
      const [{ orderId, customerId }] = await Promise.all([
        callFunction<{ orderId: string; customerId: string }>('create-mandate', { loanId: loan.id }),
        loadCheckout(),
      ])
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: env.VITE_RAZORPAY_KEY_ID,
          order_id: orderId,
          customer_id: customerId,
          recurring: '1',
          name: 'KARJMUKTBHARAT',
          description: `${formatINR(monthly)} / month`,
          theme: { color: '#0F2C61' },
          handler: () => resolve(),
          modal: { ondismiss: () => reject(new Error('cancelled')) },
        })
        rzp.open()
      })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.mandate(loan.id) }),
  })

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Repeat className="size-6 text-primary" aria-hidden />
          {t('card_you_pay')}
        </CardTitle>
        <CardDescription>
          {formatINR(monthly)}
          {t('card_per_month')} · Razorpay eMandate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {active ? (
          <Badge variant="success"><BadgeCheck aria-hidden />{t('mandate_active')}</Badge>
        ) : (
          <Button className="w-full" onClick={() => setup.mutate()} loading={setup.isPending} disabled={!env.VITE_RAZORPAY_KEY_ID || loan.verification_status !== 'verified'}>
            {t('setup_mandate')}
          </Button>
        )}
        {setup.isError && setup.error.message !== 'cancelled' && <p role="alert" className="mt-2 text-xs text-destructive">{setup.error.message}</p>}
      </CardContent>
    </Card>
  )
}
