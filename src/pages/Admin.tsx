import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ClipboardCheck, Gift, HeartHandshake, ScrollText, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Field } from '@/components/forms/Field'
import { MfaGate } from '@/components/auth/MfaGate'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { TableSkeleton } from '@/components/states/Skeletons'
import { useLuckyDraw, PAGE_SIZE } from '@/hooks/queries'
import { useT, type DictKey } from '@/i18n'
import { BLOCK_RULES } from '@/lib/calculations'
import { formatDate, formatINR, maskAccount } from '@/lib/format'
import { qk } from '@/lib/queryClient'
import { ApiError, callFunction, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { rejectSchema } from '@/lib/validation'
import { celebrate } from '@/lib/confetti'

type Tab = 'verify' | 'rescue' | 'draw' | 'audit'
const TABS: { id: Tab; label: DictKey; icon: typeof Check }[] = [
  { id: 'verify', label: 'admin_verify', icon: ClipboardCheck },
  { id: 'rescue', label: 'admin_rescue', icon: HeartHandshake },
  { id: 'draw', label: 'admin_draw', icon: Gift },
  { id: 'audit', label: 'admin_audit', icon: ScrollText },
]

const errMsg = (e: unknown, fallback: string) => (e instanceof ApiError || e instanceof Error ? e.message : fallback)

export default function Admin() {
  const t = useT()
  const [tab, setTab] = useState<Tab>('verify')
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t('admin_title')}</h1>
      <div role="tablist" aria-label={t('admin_title')} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            role="tab"
            aria-selected={tab === id}
            variant={tab === id ? 'default' : 'outline'}
            size="pill"
            onClick={() => setTab(id)}
            className="shrink-0"
          >
            <Icon aria-hidden />
            {t(label)}
          </Button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'verify' && <VerifyQueue />}
        {tab === 'rescue' && (
          <MoneyGate>
            <RescuePanel />
          </MoneyGate>
        )}
        {tab === 'draw' && (
          <MoneyGate>
            <DrawPanel />
          </MoneyGate>
        )}
        {tab === 'audit' && <AuditLog />}
      </div>
    </div>
  )
}

function MoneyGate({ children }: { children: React.ReactNode }) {
  const t = useT()
  return (
    <Card>
      <CardHeader>
        <CardDescription>{t('admin_mfa')}</CardDescription>
      </CardHeader>
      <CardContent>
        <MfaGate>{children}</MfaGate>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Verify loans: keyset-paginated pending queue (oldest first)
// ---------------------------------------------------------------------------
interface PendingLoan {
  id: string
  loan_type: 'education' | 'home'
  bank_name: string
  ifsc: string
  loan_account_last4: string
  outstanding: number
  emi: number
  is_auction_case: boolean
  created_at: string
  profiles: { full_name: string | null; mobile: string | null; aadhaar_last4: string | null } | null
}

function VerifyQueue() {
  const t = useT()
  const qc = useQueryClient()
  const [rejecting, setRejecting] = useState<PendingLoan | null>(null)

  const q = useInfiniteQuery({
    queryKey: qk.adminPending,
    initialPageParam: null as { created_at: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      let req = supabase
        .from('loans')
        .select('id, loan_type, bank_name, ifsc, loan_account_last4, outstanding, emi, is_auction_case, created_at, profiles!loans_user_id_fkey(full_name, mobile, aadhaar_last4)')
        .eq('verification_status', 'pending')
        .order('created_at')
        .order('id')
        .limit(PAGE_SIZE)
      if (pageParam) req = req.or(`created_at.gt."${pageParam.created_at}",and(created_at.eq."${pageParam.created_at}",id.gt.${pageParam.id})`)
      const { data, error } = await req
      if (error) throw error
      return data as unknown as PendingLoan[]
    },
    getNextPageParam: (last) => (last.length === PAGE_SIZE ? { created_at: last.at(-1)!.created_at, id: last.at(-1)!.id } : null),
  })

  const decide = useMutation({
    mutationFn: (v: { loanId: string; decision: 'verified' | 'rejected'; reason?: string }) => callFunction('admin-verify-loan', v),
    onSuccess: (_, v) => {
      void qc.invalidateQueries({ queryKey: qk.adminPending })
      void qc.invalidateQueries({ queryKey: qk.stats })
      if (v.decision === 'verified') void celebrate('burst')
      setRejecting(null)
    },
  })

  const rows = q.data?.pages.flat() ?? []
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  if (q.isLoading) return <TableSkeleton />
  if (!rows.length) return <Card><EmptyState icon={ClipboardCheck} title={t('empty_title')} description={t('empty_pending')} /></Card>

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-4 md:pt-6">
        {decide.isError && <p role="alert" className="text-sm text-destructive">{errMsg(decide.error, t('error_title'))}</p>}
        <ul className="flex flex-col gap-3 md:hidden">
          {rows.map((l) => (
            <li key={l.id} className="flex flex-col gap-2 rounded-card border border-border p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{l.profiles?.full_name ?? '—'}</span>
                {l.is_auction_case && <Badge variant="warning">Auction</Badge>}
              </div>
              <p className="text-xs text-muted-foreground">
                {l.bank_name} · {maskAccount(l.loan_account_last4)} · {l.ifsc}
              </p>
              <p className="text-sm tabular">{formatINR(l.outstanding)} · EMI {formatINR(l.emi)}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="success" size="sm" loading={decide.isPending && decide.variables?.loanId === l.id} onClick={() => decide.mutate({ loanId: l.id, decision: 'verified' })}>
                  <Check aria-hidden />{t('approve')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setRejecting(l)}>
                  <X aria-hidden />{t('reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">{t('full_name')}</TableHead>
                <TableHead>{t('loan_type')}</TableHead>
                <TableHead>{t('bank_name')}</TableHead>
                <TableHead className="text-right">{t('outstanding_short')}</TableHead>
                <TableHead>Aadhaar</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead className="text-right">{t('action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="sticky left-0 bg-card font-medium">
                    {l.profiles?.full_name ?? '—'}
                    {l.is_auction_case && <Badge variant="warning" className="ml-2">Auction</Badge>}
                  </TableCell>
                  <TableCell>{l.loan_type}</TableCell>
                  <TableCell>{l.bank_name} · {maskAccount(l.loan_account_last4)}</TableCell>
                  <TableCell className="text-right tabular">{formatINR(l.outstanding)}</TableCell>
                  <TableCell className="font-mono">XXXX {l.profiles?.aadhaar_last4 ?? '----'}</TableCell>
                  <TableCell>{formatDate(l.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="success" size="sm" loading={decide.isPending && decide.variables?.loanId === l.id} onClick={() => decide.mutate({ loanId: l.id, decision: 'verified' })}>
                        {t('approve')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setRejecting(l)}>{t('reject')}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {q.hasNextPage && (
          <Button variant="outline" onClick={() => q.fetchNextPage()} loading={q.isFetchingNextPage}>{t('load_more')}</Button>
        )}
      </CardContent>
      <RejectDialog
        loan={rejecting}
        loading={decide.isPending}
        onClose={() => setRejecting(null)}
        onReject={(reason) => rejecting && decide.mutate({ loanId: rejecting.id, decision: 'rejected', reason })}
      />
    </Card>
  )
}

function RejectDialog({ loan, loading, onClose, onReject }: { loan: PendingLoan | null; loading: boolean; onClose: () => void; onReject: (reason: string) => void }) {
  const t = useT()
  const form = useForm<{ reason: string }>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: '' } })
  return (
    <Dialog open={!!loan} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reject')}</DialogTitle>
          <DialogDescription>{loan?.profiles?.full_name}</DialogDescription>
        </DialogHeader>
        <form noValidate className="flex flex-col gap-4" onSubmit={form.handleSubmit(({ reason }) => onReject(reason))}>
          <Field label={t('reject_reason')} htmlFor="reason" error={form.formState.errors.reason?.message}>
            <Input id="reason" {...form.register('reason')} />
          </Field>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>{t('back')}</Button>
            <Button type="submit" variant="destructive" loading={loading}>{t('reject')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Rescue payouts
// ---------------------------------------------------------------------------
interface OpenCase {
  id: string
  loan_type: 'education' | 'home'
  display_name: string
  rescue_amount: number
  created_at: string
}
interface AuctionLoan {
  id: string
  loan_type: 'education' | 'home'
  outstanding: number
  block_number: number | null
  profiles: { full_name: string | null } | null
}

function RescuePanel() {
  const t = useT()
  const qc = useQueryClient()
  const cases = useQuery({
    queryKey: qk.adminRescue,
    queryFn: async () => {
      const [open, auction] = await Promise.all([
        supabase.from('rescue_cases').select('id, loan_type, display_name, rescue_amount, created_at').eq('is_saved', false).order('created_at').limit(PAGE_SIZE),
        supabase
          .from('loans')
          .select('id, loan_type, outstanding, block_number, profiles!loans_user_id_fkey(full_name), rescue_cases(id)')
          .eq('verification_status', 'verified')
          .eq('is_auction_case', true)
          .is('rescue_cases', null)
          .order('created_at')
          .limit(PAGE_SIZE),
      ])
      if (open.error) throw open.error
      if (auction.error) throw auction.error
      return { open: open.data as OpenCase[], auction: auction.data as unknown as AuctionLoan[] }
    },
  })

  const createCase = useMutation({
    mutationFn: async (l: AuctionLoan) => {
      const [first, last] = (l.profiles?.full_name ?? 'Member').split(' ')
      const { error } = await supabase.from('rescue_cases').insert({
        loan_id: l.id,
        loan_type: l.loan_type,
        block_number: l.block_number,
        display_name: `${first} ${last ? `${last[0]}.` : ''}`.trim(),
        rescue_amount: Math.min(l.outstanding, BLOCK_RULES[l.loan_type].avgRescueTicket),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminRescue }),
  })

  const payout = useMutation({
    mutationFn: (rescueCaseId: string) => callFunction<{ status: string; utr: string | null }>('rescue-payout', { rescueCaseId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.adminRescue })
      void qc.invalidateQueries({ queryKey: qk.rescueWall })
      void celebrate('cannons')
    },
  })

  if (cases.isError) return <ErrorState error={cases.error} onRetry={() => cases.refetch()} />
  if (cases.isLoading) return <TableSkeleton />

  return (
    <div className="flex flex-col gap-6">
      {(payout.isError || createCase.isError) && <p role="alert" className="text-sm text-destructive">{errMsg(payout.error ?? createCase.error, t('error_title'))}</p>}
      {payout.isSuccess && <p role="status" className="text-sm text-accent-700">Payout {payout.data.status}{payout.data.utr ? ` · UTR ${payout.data.utr}` : ''}</p>}
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{t('admin_rescue')}</h2>
        {!cases.data?.open.length ? (
          <EmptyState icon={HeartHandshake} title={t('empty_title')} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {cases.data.open.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-card border border-border p-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.display_name}</p>
                  <p className="text-sm tabular text-muted-foreground">{formatINR(c.rescue_amount)} · {c.loan_type}</p>
                </div>
                <Button size="sm" variant="success" loading={payout.isPending && payout.variables === c.id} onClick={() => payout.mutate(c.id)}>
                  {t('trigger_payout')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {!!cases.data?.auction.length && (
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Auction cases without a rescue case</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {cases.data.auction.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 rounded-card border border-dashed border-border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.profiles?.full_name ?? '—'}</p>
                  <p className="text-sm tabular text-muted-foreground">{formatINR(l.outstanding)}</p>
                </div>
                <Button size="sm" variant="outline" loading={createCase.isPending && createCase.variables?.id === l.id} onClick={() => createCase.mutate(l)}>
                  Create case
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lucky draw
// ---------------------------------------------------------------------------
function DrawPanel() {
  const t = useT()
  const qc = useQueryClient()
  const draw = useLuckyDraw()
  const pick = useMutation({
    mutationFn: (drawId: string) => callFunction<{ winner: string; poolSize: number }>('pick-winner', { drawId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.luckyDraw }),
  })
  if (draw.isLoading) return <TableSkeleton rows={2} />
  if (draw.isError || !draw.data) return <ErrorState error={draw.error} onRetry={() => draw.refetch()} />
  const due = new Date(draw.data.draw_at).getTime() <= Date.now()
  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">{draw.data.title}</p>
      <p className="text-sm text-muted-foreground">{formatDate(draw.data.draw_at)} · {draw.data.prize}</p>
      {draw.data.winner_display ? (
        <Badge variant="secondary" className="w-fit">{t('winner')}: {draw.data.winner_display}</Badge>
      ) : (
        <Button className="w-fit" disabled={!due} loading={pick.isPending} onClick={() => pick.mutate(draw.data!.id)}>
          <Gift aria-hidden /> {t('pick_winner')}
        </Button>
      )}
      {!due && !draw.data.winner_display && <p className="text-xs text-muted-foreground">{t('draw_pending')}</p>}
      {pick.isError && <p role="alert" className="text-sm text-destructive">{errMsg(pick.error, t('error_title'))}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Audit log (admin read only, append-only table)
// ---------------------------------------------------------------------------
interface AuditRow {
  id: number
  action: string
  ip: string | null
  metadata: Record<string, unknown>
  created_at: string
}

function AuditLog() {
  const t = useT()
  const q = useInfiniteQuery({
    queryKey: qk.adminAudit,
    initialPageParam: null as number | null,
    queryFn: async ({ pageParam }) => {
      let req = supabase.from('audit_logs').select('id, action, ip, metadata, created_at').order('id', { ascending: false }).limit(PAGE_SIZE)
      if (pageParam) req = req.lt('id', pageParam)
      const { data, error } = await req
      if (error) throw error
      return data as AuditRow[]
    },
    getNextPageParam: (last) => (last.length === PAGE_SIZE ? last.at(-1)!.id : null),
  })
  const rows = q.data?.pages.flat() ?? []
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  if (q.isLoading) return <TableSkeleton />
  if (!rows.length) return <Card><EmptyState icon={ScrollText} title={t('empty_title')} /></Card>
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin_audit')}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-card">{t('date')}</TableHead>
              <TableHead>{t('action')}</TableHead>
              <TableHead>{t('ip')}</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="sticky left-0 bg-card text-xs">{new Date(r.created_at).toLocaleString('en-IN')}</TableCell>
                <TableCell>
                  <Badge variant={r.action.includes('fail') || r.action.includes('reject') ? 'destructive' : 'outline'} className={cn('font-mono')}>{r.action}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.ip ?? '—'}</TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs" title={JSON.stringify(r.metadata)}>{JSON.stringify(r.metadata)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {q.hasNextPage && <Button variant="outline" onClick={() => q.fetchNextPage()} loading={q.isFetchingNextPage}>{t('load_more')}</Button>}
      </CardContent>
    </Card>
  )
}
