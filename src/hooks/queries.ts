import { useMemo } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isConfigured } from '@/lib/env'
import { qk, STALE } from '@/lib/queryClient'
import { calculatePlatformTotals, type BlockType } from '@/lib/calculations'
import { useBroadcast } from './useRealtime'
import { useUserId } from './useAuth'

export const PAGE_SIZE = 20

// ---------------------------------------------------------------------------
// Platform stats (landing counters). Cached 5 min, refreshed by pool broadcasts.
// ---------------------------------------------------------------------------
export interface StatRow {
  loan_type: BlockType
  users: number
  blocks: number
  rescued: number
  paid_out_total: number
}

export function usePlatformStats() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: qk.stats,
    enabled: isConfigured,
    staleTime: STALE.pools,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('platform_stats')
      if (error) throw error
      return data as StatRow[]
    },
  })
  useBroadcast('pools', 'pool_update', () => qc.invalidateQueries({ queryKey: qk.stats }))
  useBroadcast('rescue_wall', 'rescue_saved', () => qc.invalidateQueries({ queryKey: qk.stats }))

  const derived = useMemo(() => {
    const rows = query.data ?? []
    const byType = (t: BlockType) => rows.find((r) => r.loan_type === t)
    const totals = calculatePlatformTotals({ education: Number(byType('education')?.users ?? 0), home: Number(byType('home')?.users ?? 0) })
    return {
      totals,
      rescued: rows.reduce((a, r) => a + Number(r.rescued), 0),
      paidOut: Number(rows[0]?.paid_out_total ?? 0),
    }
  }, [query.data])

  return { ...query, ...derived }
}

// ---------------------------------------------------------------------------
// My loans
// ---------------------------------------------------------------------------
export interface Loan {
  id: string
  loan_type: BlockType
  bank_name: string
  loan_account_last4: string
  ifsc: string
  sanction_amount: number
  outstanding: number
  emi: number
  interest_rate: number
  is_auction_case: boolean
  verification_status: 'draft' | 'pending' | 'verified' | 'rejected'
  rejection_reason: string | null
  block_number: number | null
  seat_number: number | null
  created_at: string
}

export function useMyLoans() {
  const uid = useUserId()
  return useQuery({
    queryKey: qk.loans(uid ?? 'anon'),
    enabled: !!uid,
    staleTime: STALE.dashboard,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(
          'id, loan_type, bank_name, loan_account_last4, ifsc, sanction_amount, outstanding, emi, interest_rate, is_auction_case, verification_status, rejection_reason, block_number, seat_number, created_at',
        )
        .eq('user_id', uid!)
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) throw error
      return data as Loan[]
    },
  })
}

// ---------------------------------------------------------------------------
// My block
// ---------------------------------------------------------------------------
export interface Seat {
  seat_number: number
  initials: string
  is_me: boolean
}

export function useBlockSeats(type?: BlockType, block?: number | null) {
  return useQuery({
    queryKey: qk.seats(type ?? '-', block ?? 0),
    enabled: !!type && !!block,
    staleTime: STALE.pools,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('block_seats', { p_type: type, p_block: block })
      if (error) throw error
      return data as Seat[]
    },
  })
}

export interface Pool {
  block_number: number
  type: BlockType
  total_users: number
}

export function usePool(type?: BlockType, block?: number | null) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: qk.pool(type ?? '-', block ?? 0),
    enabled: !!type && !!block,
    staleTime: STALE.pools,
    queryFn: async () => {
      const { data, error } = await supabase.from('pools').select('block_number, type, total_users').eq('type', type!).eq('block_number', block!).single()
      if (error) throw error
      return data as Pool
    },
  })
  useBroadcast<{ type: string; block_number: number }>(
    'pools',
    'pool_update',
    (updates) => {
      if (updates.some((u) => u.type === type && u.block_number === block)) {
        void qc.invalidateQueries({ queryKey: qk.pool(type!, block!) })
        void qc.invalidateQueries({ queryKey: qk.seats(type!, block!) })
      }
    },
    !!type && !!block,
  )
  return query
}

// ---------------------------------------------------------------------------
// Transactions: keyset (cursor) pagination, 20 per page. Never offset, never "all".
// ---------------------------------------------------------------------------
export interface Txn {
  id: string
  type: 'regular_credit' | 'rescue_payout' | 'mandate_debit'
  amount: number
  utr_no: string | null
  status: 'initiated' | 'processing' | 'success' | 'failed' | 'reversed'
  created_at: string
}
type Cursor = { created_at: string; id: string } | null

export function useTransactions() {
  const uid = useUserId()
  return useInfiniteQuery({
    queryKey: qk.transactions(uid ?? 'anon'),
    enabled: !!uid,
    staleTime: STALE.dashboard,
    initialPageParam: null as Cursor,
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from('transactions')
        .select('id, type, amount, utr_no, status, created_at')
        .eq('user_id', uid!)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE)
      if (pageParam) q = q.or(`created_at.lt."${pageParam.created_at}",and(created_at.eq."${pageParam.created_at}",id.lt.${pageParam.id})`)
      const { data, error } = await q
      if (error) throw error
      return data as Txn[]
    },
    getNextPageParam: (last): Cursor => {
      const tail = last.at(-1)
      return last.length === PAGE_SIZE && tail ? { created_at: tail.created_at, id: tail.id } : null
    },
  })
}

// ---------------------------------------------------------------------------
// Rescue wall: cursor-paginated + live broadcast prepends (debounced 1s).
// ---------------------------------------------------------------------------
export interface RescueItem {
  id: string
  loan_type: BlockType
  display_name: string
  rescue_amount: number
  story: string | null
  saved_at: string
}
type WallCursor = { saved_at: string; id: string } | null

export function useRescueWall() {
  const qc = useQueryClient()
  const query = useInfiniteQuery({
    queryKey: qk.rescueWall,
    enabled: isConfigured,
    staleTime: STALE.pools,
    initialPageParam: null as WallCursor,
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from('rescue_cases')
        .select('id, loan_type, display_name, rescue_amount, story, saved_at')
        .eq('is_saved', true)
        .order('saved_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE)
      if (pageParam) q = q.or(`saved_at.lt."${pageParam.saved_at}",and(saved_at.eq."${pageParam.saved_at}",id.lt.${pageParam.id})`)
      const { data, error } = await q
      if (error) throw error
      return data as RescueItem[]
    },
    getNextPageParam: (last): WallCursor => {
      const tail = last.at(-1)
      return last.length === PAGE_SIZE && tail ? { saved_at: tail.saved_at, id: tail.id } : null
    },
  })

  useBroadcast<RescueItem>('rescue_wall', 'rescue_saved', (items) => {
    qc.setQueryData<InfiniteData<RescueItem[], WallCursor>>(qk.rescueWall, (old) => {
      if (!old) return old
      const seen = new Set(old.pages.flat().map((r) => r.id))
      const fresh = items.filter((i) => !seen.has(i.id)).map((i) => ({ ...i, story: i.story ?? null }))
      if (!fresh.length) return old
      const [first = [], ...rest] = old.pages
      return { ...old, pages: [[...fresh.reverse(), ...first], ...rest] }
    })
  })

  return query
}

// ---------------------------------------------------------------------------
// Lucky draw + mandate
// ---------------------------------------------------------------------------
export interface LuckyDraw {
  id: string
  title: string
  draw_at: string
  prize: string
  winner_display: string | null
  picked_at: string | null
}

export function useLuckyDraw() {
  return useQuery({
    queryKey: qk.luckyDraw,
    enabled: isConfigured,
    staleTime: STALE.pools,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lucky_draws')
        .select('id, title, draw_at, prize, winner_display, picked_at')
        .order('draw_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as LuckyDraw | null
    },
  })
}

export function useMandate(loanId?: string) {
  return useQuery({
    queryKey: qk.mandate(loanId ?? '-'),
    enabled: !!loanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandates')
        .select('id, status, max_amount, created_at')
        .eq('loan_id', loanId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { id: string; status: string; max_amount: number } | null
    },
  })
}
