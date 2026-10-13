import { useState } from 'react'
import { ChevronLeft, ChevronRight, Copy, Receipt } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TableSkeleton } from '@/components/states/Skeletons'
import { useTransactions, type Txn } from '@/hooks/queries'
import { useT, type DictKey } from '@/i18n'
import { formatDate, formatINR } from '@/lib/format'
import { useUiStore } from '@/stores/ui'

const TYPE_LABEL: Record<Txn['type'], DictKey> = {
  regular_credit: 'card_you_get',
  rescue_payout: 'rescued',
  mandate_debit: 'card_you_pay',
}
const STATUS_VARIANT: Record<Txn['status'], BadgeProps['variant']> = {
  success: 'success',
  processing: 'warning',
  initiated: 'outline',
  failed: 'destructive',
  reversed: 'destructive',
}

/** 20 rows per page (keyset cursor). Table on md+, cards on mobile. */
export function PaymentTable() {
  const t = useT()
  const lang = useUiStore((s) => s.lang)
  const q = useTransactions()
  const [page, setPage] = useState(0)
  const pages = q.data?.pages ?? []
  const rows = pages[page] ?? []
  const canNext = page < pages.length - 1 || q.hasNextPage

  const next = async () => {
    if (page === pages.length - 1) await q.fetchNextPage()
    setPage((p) => p + 1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="size-6 text-primary" aria-hidden />
          {t('payment_proof')}
        </CardTitle>
        <CardDescription>{t('trust_direct_d')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {q.isError ? (
          <ErrorState error={q.error} onRetry={() => q.refetch()} retrying={q.isRefetching} />
        ) : q.isLoading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState icon={Receipt} title={t('empty_title')} description={t('empty_txn')} />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((r) => (
                <li key={r.id} className="rounded-card border border-border p-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{t(TYPE_LABEL[r.type])}</span>
                    <span className="text-lg font-bold tabular text-accent-700">{formatINR(r.amount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(r.created_at, lang)}</span>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </div>
                  {r.utr_no && <Utr utr={r.utr_no} />}
                </li>
              ))}
            </ul>
            {/* md+: table with sticky first column */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card">{t('date')}</TableHead>
                    <TableHead>{t('type')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    <TableHead>{t('utr')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="sticky left-0 bg-card">{formatDate(r.created_at, lang)}</TableCell>
                      <TableCell>{t(TYPE_LABEL[r.type])}</TableCell>
                      <TableCell className="text-right font-semibold tabular">{formatINR(r.amount)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.utr_no ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft aria-hidden /> {t('back')}
              </Button>
              <span className="text-xs text-muted-foreground tabular">{page + 1}</span>
              <Button variant="outline" size="sm" disabled={!canNext} loading={q.isFetchingNextPage} onClick={next}>
                {t('next')} <ChevronRight aria-hidden />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Utr({ utr }: { utr: string }) {
  const t = useT()
  return (
    <div className="mt-2 flex items-center justify-between gap-2 rounded-card bg-muted px-2 py-1">
      <span className="truncate font-mono text-xs">
        {t('utr')}: {utr}
      </span>
      <Button variant="ghost" size="icon" aria-label={`Copy ${t('utr')}`} onClick={() => navigator.clipboard?.writeText(utr)}>
        <Copy aria-hidden />
      </Button>
    </div>
  )
}
