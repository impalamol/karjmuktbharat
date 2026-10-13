import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './supabase'

export const STALE = {
  pools: 5 * 60_000,
  dashboard: 60_000,
  static: 30 * 60_000,
} as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.dashboard,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500) && count < 2,
      retryDelay: (n) => Math.min(1000 * 2 ** n, 8000) + Math.random() * 300, // jitter avoids thundering herd
    },
    mutations: { retry: false },
  },
})

export const qk = {
  stats: ['platform-stats'] as const,
  profile: (uid: string) => ['profile', uid] as const,
  loans: (uid: string) => ['loans', uid] as const,
  seats: (type: string, block: number) => ['block-seats', type, block] as const,
  pool: (type: string, block: number) => ['pool', type, block] as const,
  transactions: (uid: string) => ['transactions', uid] as const,
  rescueWall: ['rescue-wall'] as const,
  luckyDraw: ['lucky-draw'] as const,
  mandate: (loanId: string) => ['mandate', loanId] as const,
  adminPending: ['admin', 'pending'] as const,
  adminRescue: ['admin', 'rescue'] as const,
  adminAudit: ['admin', 'audit'] as const,
  mfa: ['mfa-factors'] as const,
}
