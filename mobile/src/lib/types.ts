import type { BlockType } from './calculations'

export interface Profile {
  id: string
  mobile: string
  full_name: string | null
  aadhaar_last4: string | null
  user_type: 'borrower' | 'csr' | 'admin'
  referral_code: string
}

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
  verification_status: 'draft' | 'pending' | 'verified' | 'rejected'
  rejection_reason: string | null
  block_number: number | null
  seat_number: number | null
  created_at: string
}

export interface Pool {
  block_number: number
  type: BlockType
  total_users: number
}

export interface Txn {
  id: string
  type: 'regular_credit' | 'rescue_payout' | 'mandate_debit'
  amount: number
  utr_no: string | null
  status: 'initiated' | 'processing' | 'success' | 'failed' | 'reversed'
  created_at: string
}

export interface RescueItem {
  id: string
  loan_type: BlockType
  display_name: string
  rescue_amount: number
  story: string | null
  saved_at: string
}

export interface StatRow {
  loan_type: BlockType
  users: number
  blocks: number
  rescued: number
  paid_out_total: number
}

export interface DailyRescue {
  day: string
  saved: number
}

export interface PendingLoan {
  id: string
  loan_type: BlockType
  bank_name: string
  ifsc: string
  loan_account_last4: string
  outstanding: number
  created_at: string
  profiles: { full_name: string | null; mobile: string } | null
}
