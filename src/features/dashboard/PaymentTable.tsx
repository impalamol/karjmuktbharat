import { useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Copy, Receipt } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MotionTableRow, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TableSkeleton } from '@/components/states/Skeletons'
import { useTransactions, type Txn } from '@/hooks/queries'
import { useT, type DictKey } from '@/i18n'
import { formatDate, formatINR } from '@/lib/format'

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
    <Card variant="glass" static>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
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
          <EmptyState animation="empty" icon={Receipt} title={t('empty_txn_title')} description={t('empty_txn')} />
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((r, i) => (
                <m.li
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: 'easeOut' }}
                  className="rounded-modal border border-border bg-glass/80 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{t(TYPE_LABEL[r.type])}</span>
                    <span className="text-lg font-bold tabular text-accent-700">{formatINR(r.amount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(r.created_at)}</span>
                    <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                  </div>
                  {r.utr_no && <Utr utr={r.utr_no} />}
                </m.li>
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
                  {rows.map((r, i) => (
                    <MotionTableRow key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04, duration: 0.3 }}>
                      <TableCell className="sticky left-0 bg-card">{formatDate(r.created_at)}</TableCell>
                      <TableCell>{t(TYPE_LABEL[r.type])}</TableCell>
                      <TableCell className="text-right font-semibold tabular">{formatINR(r.amount)}</TableCell>
                      <TableCell className="font-mono text-xs">{r.utr_no ? <Utr utr={r.utr_no} inline /> : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                      </TableCell>
                    </MotionTableRow>
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

/** UTR with a copy button that pops a check mark on tap. */
function Utr({ utr, inline = false }: { utr: string; inline?: boolean }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard?.writeText(utr).catch(() => undefined)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className={inline ? 'flex items-center gap-1' : 'mt-2 flex items-center justify-between gap-2 rounded-card bg-muted px-2 py-1'}>
      <span className="truncate font-mono text-xs">
        {!inline && `${t('utr')}: `}
        {utr}
      </span>
      <Button variant="ghost" size="icon" aria-label={`${t('refer_copy')} ${t('utr')} ${utr}`} onClick={copy} className={inline ? 'fine:md:size-8' : undefined}>
        <AnimatePresence mode="wait" initial={false}>
          <m.span key={copied ? 'ok' : 'copy'} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="flex">
            {copied ? <Check className="text-accent-700" aria-hidden /> : <Copy aria-hidden />}
          </m.span>
        </AnimatePresence>
      </Button>
    </div>
  )
}
