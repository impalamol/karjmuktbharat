/**
 * Demo mode (`vite build --mode demo`): answers every Supabase and /api/auth call in the
 * browser with sample data, so the whole app can be clicked through without a backend.
 * Never included in a production build.
 */
const b64url = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
const now = Math.floor(Date.now() / 1000)
const UID = '00000000-0000-0000-0000-00000000000a'
const jwt = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: UID, exp: now + 86_400, aal: 'aal2', role: 'authenticated' })}.demo`
const user = { id: UID, aud: 'authenticated', role: 'authenticated', phone: '919876543210', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }
const session = { access_token: jwt, refresh_token: 'demo', expires_in: 86_400, expires_at: now + 86_400, token_type: 'bearer', user }

const isoAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
const names = ['Priya S., Pune', 'Rahul K., Nashik', 'Sneha M., Nagpur', 'Arjun P., Kolhapur', 'Meera D., Aurangabad']
const data = {
  profiles: { id: UID, mobile: '+919876543210', full_name: 'Asha Patil (demo)', aadhaar_last4: '2346', user_type: 'admin', referral_code: 'ASHA2026', preferred_lang: 'en', created_at: isoAgo(30) },
  loans: [
    { id: 'demo-loan', loan_type: 'education', bank_name: 'State Bank of India', loan_account_last4: '7788', ifsc: 'SBIN0001234', sanction_amount: 1_200_000, outstanding: 1_000_000, emi: 12_668, interest_rate: 9, is_auction_case: false, verification_status: 'verified', rejection_reason: null, block_number: 42, seat_number: 317, created_at: isoAgo(20) },
  ],
  seats: Array.from({ length: 640 }, (_, i) => ({ seat_number: i + 1, initials: ['AP', 'RK', 'SM', 'VD', 'PN'][i % 5], is_me: i + 1 === 317 })),
  pool: { block_number: 42, type: 'education', total_users: 640 },
  txns: Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, type: i % 4 === 0 ? 'mandate_debit' : 'regular_credit', amount: i % 4 === 0 ? 1500 : 3200, utr_no: `SBIN2610${100000 + i}`, status: i === 0 ? 'processing' : 'success', created_at: isoAgo(i * 30) })),
  rescue: Array.from({ length: 20 }, (_, i) => ({ id: `r${i}`, loan_type: i % 3 ? 'home' : 'education', display_name: names[i % names.length], rescue_amount: i % 3 ? 500_000 : 300_000, story: i % 2 ? 'Saved from auction two days before the bank deadline.' : null, saved_at: isoAgo(i) })),
  stats: [
    { loan_type: 'education', users: 123_456, blocks: 124, rescued: 2_640, paid_out_total: 734_000_000 },
    { loan_type: 'home', users: 456_789, blocks: 457, rescued: 4_950, paid_out_total: 734_000_000 },
  ],
  draw: { id: 'd1', title: 'Diwali Lucky Draw 2026', draw_at: '2026-11-08T13:00:00Z', prize: 'One EMI paid directly to your loan account', winner_display: null, picked_at: null },
  pending: Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, loan_type: 'home', bank_name: 'HDFC Bank', ifsc: 'HDFC0001234', loan_account_last4: `12${i}9`, outstanding: 2_500_000, emi: 26_000, is_auction_case: i === 1, created_at: isoAgo(i), profiles: { full_name: ['Vikram Deshmukh', 'Kavita Jadhav', 'Rohan Shinde', 'Pooja Kulkarni', 'Amit Pawar'][i], mobile: '+919800000000', aadhaar_last4: '4321' } })),
  audit: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, actor_id: UID, action: ['loan.verify', 'bank.update', 'payout.rescue', 'draw.pick'][i % 4], entity: 'loans', entity_id: `p${i % 5}`, ip: `49.36.${10 + i}.21`, created_at: isoAgo(i / 4) })),
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

function route(url: URL, init?: RequestInit): Response | null {
  const p = url.pathname
  const headers = new Headers(init?.headers)
  const single = (headers.get('accept') ?? '').includes('vnd.pgrst.object')
  const send = (body: unknown) => json(single && Array.isArray(body) ? (body[0] ?? null) : body)

  if (p.endsWith('/api/auth/refresh')) return json({ session })
  if (p.endsWith('/api/auth/session')) return json({ ok: true })
  if (url.hostname !== 'demo.supabase.co') return null

  if (p === '/auth/v1/user') return json(user)
  if (p.startsWith('/auth/v1/')) return json({ totp: [], all: [], phone: [] })
  if (p.startsWith('/functions/v1/')) return json({ ok: true, status: 'processed', utr: 'SBIN2610DEMO01' })
  if (p === '/rest/v1/rpc/platform_stats') return send(data.stats)
  if (p === '/rest/v1/rpc/block_seats') return send(data.seats)
  if (p === '/rest/v1/profiles') return send(data.profiles)
  if (p === '/rest/v1/loans' && url.searchParams.get('is_auction_case') === 'eq.true')
    return send(data.pending.slice(0, 2).map((l, i) => ({ ...l, block_number: 7 + i, rescue_cases: [] })))
  if (p === '/rest/v1/loans') return send(url.searchParams.get('verification_status') === 'eq.pending' ? data.pending : data.loans)
  if (p === '/rest/v1/pools') return send(data.pool)
  if (p === '/rest/v1/transactions') return send(data.txns)
  if (p === '/rest/v1/rescue_cases') return send(data.rescue)
  if (p === '/rest/v1/lucky_draws') return send(data.draw)
  if (p === '/rest/v1/mandates') return send(null)
  if (p === '/rest/v1/audit_logs') return send(data.audit)
  return json([])
}

export function installDemoBackend() {
  const real = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href)
    const res = route(url, init ?? (input instanceof Request ? { headers: input.headers } : undefined))
    if (res) {
      await new Promise((r) => setTimeout(r, 250)) // feel like a network
      return res
    }
    return real(input, init)
  }
}
