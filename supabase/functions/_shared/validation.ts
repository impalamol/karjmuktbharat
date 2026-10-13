import { z } from 'npm:zod@3'

const clean = (s: string) => s.normalize('NFKC').replace(/[<>"'`\\\u0000-\u001F]/g, '').replace(/\s+/g, ' ').trim()

// Verhoeff checksum used by Aadhaar.
const D = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]]
const P = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]]
export function verhoeffValid(num: string): boolean {
  let c = 0
  const digits = num.split('').reverse().map(Number)
  for (let i = 0; i < digits.length; i++) c = D[c]![P[i % 8]![digits[i]!]!]!
  return c === 0
}

export const fullName = z.string().transform(clean).pipe(z.string().min(2).max(80).regex(/^[\p{L}\p{M} .'-]+$/u))
export const bankName = z.string().transform(clean).pipe(z.string().min(2).max(80))
export const ifsc = z.string().transform((s) => s.trim().toUpperCase()).pipe(z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/))
export const loanAccount = z.string().transform((s) => s.replace(/\s/g, '').toUpperCase()).pipe(z.string().regex(/^[0-9A-Z]{6,20}$/))
export const aadhaar = z.string().transform((s) => s.replace(/\s/g, '')).pipe(
  z.string().regex(/^[2-9][0-9]{11}$/).refine(verhoeffValid, 'Invalid Aadhaar number'),
)
export const rupees = (min: number, max: number) => z.coerce.number().int().min(min).max(max)

export const loanSubmission = z
  .object({
    fullName,
    aadhaar,
    loanType: z.enum(['education', 'home']),
    bankName,
    ifsc,
    loanAccount,
    sanctionAmount: rupees(10_000, 50_00_00_000),
    outstanding: rupees(0, 50_00_00_000),
    emi: rupees(100, 1_00_00_000),
    interestRate: z.coerce.number().min(0).max(40),
    isAuctionCase: z.boolean().default(false),
    consent: z.literal(true),
  })
  .strict()
  .refine((v) => v.outstanding <= v.sanctionAmount * 2, { path: ['outstanding'], message: 'Outstanding looks too high' })

export const bankUpdate = z.object({ loanId: z.string().uuid(), bankName, ifsc, loanAccount }).strict()
export const uuidBody = (key: string) => z.object({ [key]: z.string().uuid() }).strict()
