import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Landmark, Lock, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FloatingField } from '@/components/forms/FloatingField'
import { MfaGate } from '@/components/auth/MfaGate'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { CardSkeleton } from '@/components/states/Skeletons'
import { useMyLoans, type Loan } from '@/hooks/queries'
import { useT } from '@/i18n'
import { maskAccount } from '@/lib/format'
import { ApiError, callFunction } from '@/lib/supabase'
import { bankSchema, type BankDetails } from '@/lib/validation'

export default function Bank() {
  const t = useT()
  const loans = useMyLoans()
  const [editing, setEditing] = useState<Loan | null>(null)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{t('bank_title')}</h1>
      {saved && (
        <p role="status" className="flex items-center gap-2 rounded-card bg-accent-50 p-3 text-sm text-accent-700">
          <CheckCircle2 className="size-4" aria-hidden /> {t('bank_saved')}
        </p>
      )}
      {loans.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
        </div>
      ) : loans.isError ? (
        <ErrorState error={loans.error} onRetry={() => loans.refetch()} />
      ) : !loans.data?.length ? (
        <Card variant="glass">
          <EmptyState icon={Landmark} title={t('empty_title')} description={t('how_1_d')} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loans.data.map((loan) => (
            <Card key={loan.id} variant="glass">
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <CardTitle>{loan.bank_name}</CardTitle>
                  <CardDescription>{loan.loan_type === 'home' ? t('home_title') : t('edu_title')}</CardDescription>
                </div>
                <Badge variant={loan.verification_status === 'verified' ? 'success' : loan.verification_status === 'rejected' ? 'destructive' : 'warning'}>
                  {loan.verification_status}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <dl className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t('bank_masked')}</dt>
                    <dd className="font-mono font-semibold tabular">{maskAccount(loan.loan_account_last4)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{t('ifsc')}</dt>
                    <dd className="font-mono">{loan.ifsc}</dd>
                  </div>
                </dl>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="size-3" aria-hidden /> AES-256 · 2FA
                </p>
                <Button variant="outline" onClick={() => { setSaved(false); setEditing(loan) }}>
                  <Pencil aria-hidden /> {t('bank_edit')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('bank_edit')}</DialogTitle>
            <DialogDescription>{t('bank_reverify')}</DialogDescription>
          </DialogHeader>
          {editing && (
            <MfaGate>
              <BankForm
                loan={editing}
                onSaved={() => {
                  setEditing(null)
                  setSaved(true)
                }}
              />
            </MfaGate>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BankForm({ loan, onSaved }: { loan: Loan; onSaved: () => void }) {
  const t = useT()
  const qc = useQueryClient()
  const form = useForm<BankDetails>({
    resolver: zodResolver(bankSchema),
    defaultValues: { bankName: loan.bank_name, ifsc: loan.ifsc, loanAccount: '', loanAccountConfirm: '' },
  })
  const e = form.formState.errors
  const save = useMutation({
    mutationFn: (v: BankDetails) => callFunction('update-bank', { loanId: loan.id, bankName: v.bankName, ifsc: v.ifsc, loanAccount: v.loanAccount }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['loans'] })
      onSaved()
    },
  })

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
      <FloatingField id="b-name" label={t('bank_name')} error={e.bankName?.message} {...form.register('bankName')} />
      <FloatingField id="b-ifsc" label={t('ifsc')} error={e.ifsc?.message} className="uppercase" maxLength={11} {...form.register('ifsc')} />
      <FloatingField id="b-acc" label={t('loan_account')} error={e.loanAccount?.message} inputMode="numeric" autoComplete="off" {...form.register('loanAccount')} />
      <FloatingField
        id="b-acc2"
        label={t('loan_account_confirm')}
        error={e.loanAccountConfirm?.message}
        inputMode="numeric"
        autoComplete="off"
        onPaste={(ev) => ev.preventDefault()}
        {...form.register('loanAccountConfirm')}
      />
      {save.isError && <p role="alert" className="text-sm text-destructive">{save.error instanceof ApiError ? save.error.message : t('error_title')}</p>}
      <Button type="submit" variant="glow" loading={save.isPending}>{t('bank_save')}</Button>
    </form>
  )
}
