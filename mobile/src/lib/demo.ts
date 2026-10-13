import type { DailyRescue, Loan, PendingLoan, Pool, Profile, RescueItem, StatRow, Txn } from './types'
import type { BlockType } from './calculations'

/** Sample data for demo mode (no Supabase keys). Clearly fictional people. */
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()

export const demoProfile: Profile = {
  id: 'demo-user',
  mobile: '+919876543210',
  full_name: 'Monika Patil',
  aadhaar_last4: '2346',
  user_type: 'admin',
  referral_code: 'MONIKA26',
}

export const demoLoan: Loan = {
  id: 'demo-loan',
  loan_type: 'home',
  bank_name: 'State Bank of India',
  loan_account_last4: '9292',
  ifsc: 'SBIN0001234',
  sanction_amount: 3_500_000,
  outstanding: 2_800_000,
  emi: 26_500,
  interest_rate: 8.75,
  verification_status: 'verified',
  rejection_reason: null,
  block_number: 42,
  seat_number: 317,
  created_at: daysAgo(40),
}

export const demoPool: Pool = { block_number: 42, type: 'home', total_users: 1000 }

const RESCUES: [string, BlockType, number, string][] = [
  ['Sunita T., Nashik', 'home', 520_000, 'Saved from auction two days before the bank deadline.'],
  ['Amol S., Pune', 'education', 300_000, 'Loan pulled back from NPA after a job loss.'],
  ['Kavita J., Nagpur', 'home', 480_000, 'Family kept their home after a medical emergency.'],
  ['Rohan D., Kolhapur', 'education', 280_000, 'Engineering loan cleared before default.'],
  ['Meera K., Aurangabad', 'home', 550_000, 'Auction notice withdrawn.'],
  ['Arjun P., Satara', 'education', 310_000, 'Nursing degree loan rescued.'],
]
export const demoRescues: RescueItem[] = Array.from({ length: 60 }, (_, i) => {
  const [name, type, amount, story] = RESCUES[i % RESCUES.length]!
  return { id: `r${i}`, display_name: name, loan_type: type, rescue_amount: amount, story, saved_at: daysAgo(i * 0.4) }
})

export const demoTxns: Txn[] = Array.from({ length: 120 }, (_, i) => ({
  id: `t${i}`,
  type: i % 3 === 0 ? 'mandate_debit' : 'regular_credit',
  amount: i % 3 === 0 ? 3000 : 4400,
  utr_no: `SBIN2610${String(400000 + i)}`,
  status: i === 0 ? 'processing' : 'success',
  created_at: daysAgo(i * 10),
}))

export const demoStats: StatRow[] = [
  { loan_type: 'education', users: 500_000, blocks: 500, rescued: 136_000, paid_out_total: 18_000_000_000 },
  { loan_type: 'home', users: 2_000_000, blocks: 2000, rescued: 268_800, paid_out_total: 105_000_000_000 },
]

/** Deterministic pseudo-random daily rescue counts around the monthly average. */
export function demoDaily(type: BlockType, days: number, monthly: number): DailyRescue[] {
  let seed = type === 'home' ? 7 : 3
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  const avg = monthly / 30
  return Array.from({ length: days }, (_, i) => ({ day: daysAgo(days - 1 - i), saved: Math.round(avg * (0.75 + rand() * 0.5)) }))
}

export const demoPending: PendingLoan[] = ['Vikram Deshmukh', 'Kavita Jadhav', 'Rohan Shinde', 'Pooja Kulkarni', 'Amit Pawar'].map((n, i) => ({
  id: `p${i}`,
  loan_type: i % 2 ? 'education' : 'home',
  bank_name: i % 2 ? 'Bank of Maharashtra' : 'HDFC Bank',
  ifsc: i % 2 ? 'MAHB0000123' : 'HDFC0001234',
  loan_account_last4: `${1200 + i * 37}`,
  outstanding: i % 2 ? 650_000 : 2_500_000,
  created_at: daysAgo(i),
  profiles: { full_name: n, mobile: '+919800000000' },
}))
