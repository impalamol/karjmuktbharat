import { z } from 'zod'

/**
 * Client-side Zod schemas. The same rules are enforced again server-side in
 * supabase/functions/_shared/validation.ts and by DB CHECK constraints.
 */

/** Strip control chars and markup characters, collapse whitespace. */
export const sanitize = (s: string) =>
  // eslint-disable-next-line no-control-regex -- stripping control characters is the point
  s.normalize('NFKC').replace(/[<>"'`\\\u0000-\u001F]/g, '').replace(/\s+/g, ' ').trim()

const D = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]]
const P = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]]
export function verhoeffValid(num: string): boolean {
  let c = 0
  const digits = num.split('').reverse().map(Number)
  for (let i = 0; i < digits.length; i++) c = D[c]![P[i % 8]![digits[i]!]!]!
  return c === 0
}

export const mobileSchema = z.object({
  mobile: z
    .string()
    .transform((s) => s.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, ''))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')),
})

export const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit OTP') })

export const profileSchema = z.object({
  fullName: z
    .string()
    .transform(sanitize)
    .pipe(z.string().min(2, 'Enter your full name').max(80).regex(/^[\p{L}\p{M} .'-]+$/u, 'Use letters only')),
  aadhaar: z
    .string()
    .transform((s) => s.replace(/\s/g, ''))
    .pipe(z.string().regex(/^[2-9]\d{11}$/, 'Aadhaar has 12 digits').refine(verhoeffValid, 'Invalid Aadhaar number')),
})
export type ProfileDetails = z.infer<typeof profileSchema>

const rupees = (min: number, max: number, msg: string) => z.coerce.number({ invalid_type_error: msg }).int(msg).min(min, msg).max(max, msg)

export const loanSchema = z
  .object({
    loanType: z.enum(['education', 'home']),
    sanctionAmount: rupees(10_000, 50_00_00_000, 'Enter the sanctioned amount'),
    outstanding: rupees(0, 50_00_00_000, 'Enter the outstanding amount'),
    emi: rupees(100, 1_00_00_000, 'Enter your monthly EMI'),
    interestRate: z.coerce.number({ invalid_type_error: 'Enter interest rate' }).min(0).max(40, 'Rate must be under 40%'),
    isAuctionCase: z.boolean().default(false),
  })
  .refine((v) => v.outstanding <= v.sanctionAmount * 2, { path: ['outstanding'], message: 'Outstanding looks too high' })
export type LoanDetails = z.infer<typeof loanSchema>

export const ifscSchema = z
  .string()
  .transform((s) => s.trim().toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC (e.g. SBIN0001234)'))
export const loanAccountSchema = z
  .string()
  .transform((s) => s.replace(/\s/g, '').toUpperCase())
  .pipe(z.string().regex(/^[0-9A-Z]{6,20}$/, 'Enter 6 to 20 letters or digits'))
export const bankNameSchema = z.string().transform(sanitize).pipe(z.string().min(2, 'Enter bank name').max(80))

export const bankSchema = z
  .object({
    bankName: bankNameSchema,
    ifsc: ifscSchema,
    loanAccount: loanAccountSchema,
    loanAccountConfirm: z.string().transform((s) => s.replace(/\s/g, '').toUpperCase()),
  })
  .refine((v) => v.loanAccount === v.loanAccountConfirm, { path: ['loanAccountConfirm'], message: 'Account numbers do not match' })
export type BankDetails = z.infer<typeof bankSchema>
export type BankDetailsPublic = Pick<BankDetails, 'bankName' | 'ifsc'>

export const consentSchema = z.object({ consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm to continue' }) }) })

export const totpSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') })

export const rejectSchema = z.object({ reason: z.string().transform(sanitize).pipe(z.string().min(5, 'Give a short reason').max(300)) })
