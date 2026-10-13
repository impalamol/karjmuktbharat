import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isDemo } from './env'
import { supabase, callFunction } from './supabase'
import { demoDaily, demoLoan, demoPending, demoPool, demoProfile, demoRescues, demoStats, demoTxns } from './demo'
import { calculatePooledRescueCapacity, type BlockType } from './calculations'
import type { DailyRescue, Loan, PendingLoan, Pool, Profile, RescueItem, StatRow, Txn } from './types'
import { useSession } from '@/stores/session'

/**
 * Data hooks. Same tables, RPCs and RLS as the web app. In demo mode they resolve
 * from sample data so every screen can be tried without a backend.
 */
export const PAGE = 20
const MIN = 60_000
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 300))

export const qk = {
  profile: ['profile'] as const,
  loans: ['loans'] as const,
  pool: (t: string, b: number) => ['pool', t, b] as const,
  stats: ['stats'] as const,
  daily: (t: string, d: number) => ['daily', t, d] as const,
  txns: ['txns'] as const,
  rescue: ['rescue'] as const,
  pending: ['pending'] as const,
}

function useUid() {
  return useSession((s) => s.userId)
}

export function useProfile() {
  const uid = useUid()
  return useQuery({
    queryKey: qk.profile,
    enabled: !!uid,
    staleTime: MIN,
    queryFn: async (): Promise<Profile> => {
      if (isDemo) return wait(demoProfile)
      const { data, error } = await supabase.from('profiles').select('id, mobile, full_name, aadhaar_last4, user_type, referral_code').eq('id', uid!).single()
      if (error) throw error
      return data as Profile
    },
  })
}

export function useMyLoan() {
  const uid = useUid()
  return useQuery({
    queryKey: qk.loans,
    enabled: !!uid,
    staleTime: MIN,
    queryFn: async (): Promise<Loan | null> => {
      if (isDemo) return wait(demoLoan)
      const { data, error } = await supabase
        .from('loans')
        .select('id, loan_type, bank_name, loan_account_last4, ifsc, sanction_amount, outstanding, emi, interest_rate, verification_status, rejection_reason, block_number, seat_number, created_at')
        .eq('user_id', uid!)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      const rows = (data ?? []) as Loan[]
      return rows.find((l) => l.verification_status === 'verified') ?? rows[0] ?? null
    },
  })
}

export function usePool(type?: BlockType, block?: number | null) {
  return useQuery({
    queryKey: qk.pool(type ?? '-', block ?? 0),
    enabled: !!type && !!block,
    staleTime: 5 * MIN,
    queryFn: async (): Promise<Pool> => {
      if (isDemo) return wait(demoPool)
      const { data, error } = await supabase.from('pools').select('block_number, type, total_users').eq('type', type!).eq('block_number', block!).single()
      if (error) throw error
      return data as Pool
    },
  })
}

export function usePlatformStats() {
  return useQuery({
    queryKey: qk.stats,
    staleTime: 5 * MIN,
    queryFn: async (): Promise<StatRow[]> => {
      if (isDemo) return wait(demoStats)
      const { data, error } = await supabase.rpc('platform_stats')
      if (error) throw error
      return (data ?? []) as StatRow[]
    },
  })
}

/** Rescues saved per day, aggregated in Postgres (rescue_daily RPC). */
export function useRescueDaily(type: BlockType, days: number, users: number) {
  return useQuery({
    queryKey: qk.daily(type, days),
    staleTime: 5 * MIN,
    queryFn: async (): Promise<DailyRescue[]> => {
      if (isDemo) return wait(demoDaily(type, days, calculatePooledRescueCapacity(type, users)))
      const { data, error } = await supabase.rpc('rescue_daily', { p_type: type, p_days: days })
      if (error) throw error
      return ((data ?? []) as { day: string; saved: number }[]).map((r) => ({ day: r.day, saved: Number(r.saved) }))
    },
  })
}

/** Keyset pagination (created_at, id): never offset, so page 5,000 costs the same as page 1. */
export function useTransactions() {
  const uid = useUid()
  return useInfiniteQuery({
    queryKey: qk.txns,
    enabled: !!uid,
    staleTime: MIN,
    initialPageParam: null as null | { created_at: string; id: string },
    queryFn: async ({ pageParam }): Promise<Txn[]> => {
      if (isDemo) {
        const start = pageParam ? demoTxns.findIndex((t) => t.id === pageParam.id) + 1 : 0
        return wait(demoTxns.slice(start, start + PAGE))
      }
      let q = supabase.from('transactions').select('id, type, amount, utr_no, status, created_at').eq('user_id', uid!).order('created_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE)
      if (pageParam) q = q.or(`created_at.lt."${pageParam.created_at}",and(created_at.eq."${pageParam.created_at}",id.lt.${pageParam.id})`)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Txn[]
    },
    getNextPageParam: (last) => (last.length === PAGE ? { created_at: last.at(-1)!.created_at, id: last.at(-1)!.id } : null),
  })
}

export function useRescueWall() {
  return useInfiniteQuery({
    queryKey: qk.rescue,
    staleTime: 5 * MIN,
    initialPageParam: null as null | { saved_at: string; id: string },
    queryFn: async ({ pageParam }): Promise<RescueItem[]> => {
      if (isDemo) {
        const start = pageParam ? demoRescues.findIndex((t) => t.id === pageParam.id) + 1 : 0
        return wait(demoRescues.slice(start, start + PAGE))
      }
      let q = supabase.from('rescue_cases').select('id, loan_type, display_name, rescue_amount, story, saved_at').eq('is_saved', true).order('saved_at', { ascending: false }).order('id', { ascending: false }).limit(PAGE)
      if (pageParam) q = q.or(`saved_at.lt."${pageParam.saved_at}",and(saved_at.eq."${pageParam.saved_at}",id.lt.${pageParam.id})`)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as RescueItem[]
    },
    getNextPageParam: (last) => (last.length === PAGE ? { saved_at: last.at(-1)!.saved_at, id: last.at(-1)!.id } : null),
  })
}

/** Looks a UTR up in the member's own transactions (RLS limits it to their rows). */
export async function findUtr(utr: string): Promise<Txn | null> {
  if (isDemo) return wait(demoTxns.find((t) => t.utr_no === utr) ?? null)
  const { data, error } = await supabase.from('transactions').select('id, type, amount, utr_no, status, created_at').eq('utr_no', utr).maybeSingle()
  if (error) throw error
  return data as Txn | null
}

export function usePendingLoans(enabled: boolean) {
  return useQuery({
    queryKey: qk.pending,
    enabled,
    queryFn: async (): Promise<PendingLoan[]> => {
      if (isDemo) return wait(demoPending)
      const { data, error } = await supabase
        .from('loans')
        .select('id, loan_type, bank_name, ifsc, loan_account_last4, outstanding, created_at, profiles!loans_user_id_fkey(full_name, mobile)')
        .eq('verification_status', 'pending')
        .order('created_at')
        .limit(PAGE)
      if (error) throw error
      return (data ?? []) as unknown as PendingLoan[]
    },
  })
}

export function useVerifyLoan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { loanId: string; decision: 'verified' | 'rejected'; reason?: string }) => {
      if (isDemo) return wait({ ok: true })
      return callFunction('admin-verify-loan', v)
    },
    onSuccess: (_, v) => {
      qc.setQueryData<PendingLoan[]>(qk.pending, (rows) => rows?.filter((r) => r.id !== v.loanId))
      void qc.invalidateQueries({ queryKey: qk.stats })
    },
  })
}

export function useUpdateBank() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { loanId: string; bankName: string; ifsc: string; loanAccount: string }) => {
      if (isDemo) return wait({ ok: true })
      return callFunction('update-bank', v)
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.loans }),
  })
}
