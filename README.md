# KARJMUKTBHARAT.COM

**Karj Se Mukti, Bharat Ki Pragati** · *Shikshanala Hath, Hakkachya Gharala Sath*

A community and CSR pooling platform for education and home loans. 1,000 borrowers plus CSR partners form one ₹1 Crore block each month. 80% of the CSR money rescues auction or default cases. The rest, together with borrower contributions, is paid straight into every member's **bank loan account** with a UTR. There is no wallet.

| | Education block | Home block |
|---|---|---|
| Borrower pool | ₹15 L (₹1,500/user) | ₹30 L (₹3,000/user) |
| CSR pool | ₹85 L | ₹70 L |
| Rescue (80% CSR) | ₹68 L → **22 students** | ₹56 L → **11 houses** |
| Regular (20% CSR + borrower) | ₹32 L → **₹3,200/user/month** | ₹44 L → **₹4,400/user/month** |
| Target users | 5 L (500 blocks) | 20 L (2,000 blocks) |

At 25 lakh users the platform moves ₹2,500 Cr per month and rescues 33,000 families per month. `src/lib/calculations.test.ts` checks these numbers.

## Stack

React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Zustand, TanStack Query and Virtual, Recharts, Zod. The backend is Supabase (Postgres, Auth, Realtime Broadcast, Storage, Edge Functions, Supavisor/PgBouncer). Payments use Razorpay eMandate and RazorpayX payouts, in test mode. The app ships as a PWA through vite-plugin-pwa and deploys on Vercel Edge.

## Project layout

```
src/
  lib/design-tokens.ts   single source of design tokens (Tailwind reads it)
  lib/calculations.ts    pure business logic; every dashboard number comes from here
  lib/validation.ts      Zod schemas for every form
  lib/supabase.ts        in-memory session + httpOnly cookie sync, Edge Function client
  components/ui/         shadcn/ui: Button, Card, Input, Dialog, Badge, Progress, Table (+ Label, Skeleton)
  components/layout/     AppShell: bottom nav (<768), collapsible sidebar (768–1024), fixed 280px sidebar (>1024)
  features/dashboard/    LoanCard + tenure chart, 1000-seat BlockGrid, RescueWall, PaymentTable, LuckyDraw, MandateCard
  pages/                 Landing, Onboard (5 steps), Dashboard, Bank, Refer, Admin (all lazy-loaded)
api/auth/                Vercel Edge: httpOnly refresh-token cookie (session / refresh)
supabase/
  migrations/            schema, RLS, indexes, triggers, broadcast, storage
  functions/             Edge Functions (Deno)
  tests/                 RLS + business-rule tests on a real Postgres
```

## Security

- **RLS is on for every table** and access starts from zero grants.
  - `profiles`: a user can read and update only their own row, and only the `full_name` and `preferred_lang` columns, so nobody can promote themselves to admin.
  - `loans`: a user reads only their own; an admin reads all. Writes go only through Edge Functions.
  - `transactions`: a user reads only their own. Nobody can update or delete them through the API. A trigger also blocks changes to amount, user and type, even for the service role.
  - `pools`, `rescue_cases`, `block_rules`, `lucky_draws`: anyone can read; only admins can write. Every admin API write is audited by a trigger.
  - `audit_logs`: only admins can read. The table is append-only, so updates and deletes fail even for the service role.
- **Loan account number**: encrypted with AES-256-GCM inside Edge Functions using a random IV. Each value is bound to its loan id through AAD, so ciphertext cannot be moved to another row. It is decrypted only inside the payout functions.
- **Aadhaar**: the database stores only the last 4 digits. The full number is encrypted and kept in the private `kyc` bucket, which has no client policies at all.
- **Auth**: phone OTP. The `send-sms-hook` limits OTPs to 3 per mobile and 10 per IP every 10 minutes, and it runs server-side, so clients cannot bypass it. Bank changes, payouts and lucky draws need TOTP 2FA, and the Edge Function checks the `aal2` claim.
- **Tokens**: nothing sensitive is stored in localStorage. The access token lives only in memory. The refresh token sits in a `__Host-` httpOnly, Secure, SameSite=Strict cookie set by `/api/auth/*`, which also checks the request origin against CSRF.
- **Validation**: Zod runs on the client and again in the Edge Functions, and DB CHECK constraints back both up. Inputs are sanitised and unknown keys are rejected. All queries are parameterised through PostgREST.
- **Storage**: buckets are private only. Documents are served through signed URLs that expire after 60 seconds.
- **Headers** (`vercel.json`): CSP, HSTS with preload, X-Frame-Options DENY, nosniff, Referrer-Policy and Permissions-Policy.
- **Audit**: every loan submission, verification, bank change, payout, draw, webhook and admin write is logged with its IP.

## Scale (25 lakh+ users)

- Every list uses keyset (cursor) pagination with 20 rows per page. The API is also capped at `max_rows = 100`.
- The 1,000-seat block grid and the Rescue Wall are virtualized with `@tanstack/react-virtual`.
- TanStack Query keeps pools and stats fresh for 5 minutes and the dashboard for 1 minute. Retries use jittered backoff.
- Realtime uses **Broadcast** topics (`pools`, `rescue_wall`) fed by DB triggers, not `postgres_changes`. Clients debounce updates by 1 second.
- Indexes cover `user_id`, `loan_type`, `verification_status`, `created_at` and `block_number`, plus partial indexes for the pending queue, open blocks and the rescue wall.
- Landing counters read O(1) counter rows and a ≤2,500-row pools table, never `COUNT(*)` over millions of rows.
- Seat allocation runs inside a transaction under a per-type advisory lock, so concurrent verifications never double-book a seat.
- Every page is code-split. **First load is 212 kB gzipped** against a 300 kB budget, and `npm run size` enforces it in CI. Recharts (about 105 kB) loads only with the dashboard chart. All chunks together come to about 487 kB, with Lottie, confetti and Recharts loaded only when needed.

## Getting started

```bash
cp .env.example .env.local        # add Supabase URL + anon key, Razorpay test key
npm install
npm run dev
```

Supabase:

```bash
supabase link --project-ref <ref>
supabase db push                                   # applies supabase/migrations
supabase secrets set FIELD_ENCRYPTION_KEY=$(openssl rand -base64 32) \
  OTP_HASH_SECRET=$(openssl rand -hex 32) \
  SEND_SMS_HOOK_SECRET=<from Auth > Hooks> \
  MSG91_AUTH_KEY=... MSG91_OTP_TEMPLATE_ID=... \
  RAZORPAY_KEY_ID=rzp_test_... RAZORPAY_KEY_SECRET=... \
  RAZORPAYX_ACCOUNT_NUMBER=... RAZORPAY_WEBHOOK_SECRET=... \
  ALLOWED_ORIGINS=https://karjmuktbharat.com,https://www.karjmuktbharat.com
supabase functions deploy
```

Then, in the Supabase dashboard:
1. Enable the **Send SMS hook** and point it at `send-sms-hook`.
2. Enable **TOTP MFA**.
3. Use the **pooler (transaction mode)** connection string for any server-side DB clients.

To make someone an admin, run `update profiles set user_type = 'admin' where mobile = '+91...'` in the SQL editor.

On Vercel, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID` and `VITE_SITE_URL`, plus `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the `/api/auth` functions.

Point the Razorpay webhook (payout.* and token.* events) at `https://<project>.supabase.co/functions/v1/razorpay-webhook`.

## Checks

```bash
npm run ci              # shared-logic sync, lint, typecheck, unit tests, build, bundle budget
npm run test:db         # migrations + 36 RLS / business-rule tests on Postgres 16
npm run check:functions # deno check + crypto/validation tests (needs Deno)
```

## Edge Functions

| Function | Who | What |
|---|---|---|
| `submit-loan` | user | Validates onboarding, encrypts the account number and Aadhaar, stores the loan as pending |
| `update-bank` | user + 2FA | Re-encrypts new bank details and sends the loan back for re-verification |
| `admin-verify-loan` | admin | Approves or rejects a loan; approval seats it in a block |
| `rescue-payout` | admin + 2FA | Idempotent RazorpayX payout into the borrower's loan account |
| `regular-payout-batch` | admin + 2FA | Monthly ₹3,200/₹4,400 credits per block, 25 per call, idempotent per month |
| `pick-winner` | admin + 2FA | Crypto-random, unbiased lucky draw winner |
| `create-mandate` | user | Razorpay eMandate registration for the monthly contribution |
| `razorpay-webhook` | Razorpay | HMAC-verified updates of UTR, payout status and mandate status |
| `send-sms-hook` | Supabase Auth | OTP rate limit (3 per 10 minutes) and SMS delivery |

`supabase/functions/_shared/calculations.ts` is generated from `src/lib/calculations.ts` by `npm run sync:shared`, so the client and the server use identical maths. CI fails if the copy is stale.
