import { describe, expect, it } from 'vitest'
import { bankSchema, loanSchema, mobileSchema, profileSchema, sanitize, verhoeffValid } from './validation'

describe('validation', () => {
  it('normalises Indian mobile numbers', () => {
    expect(mobileSchema.parse({ mobile: '+91 98765 43210' }).mobile).toBe('9876543210')
    expect(mobileSchema.safeParse({ mobile: '1234567890' }).success).toBe(false)
  })
  it('validates Aadhaar with Verhoeff', () => {
    expect(verhoeffValid('234123412346')).toBe(true)
    expect(profileSchema.safeParse({ fullName: 'Asha Patil', aadhaar: '2341 2341 2345' }).success).toBe(false)
    expect(profileSchema.parse({ fullName: ' Asha  Patil ', aadhaar: '2341 2341 2346' })).toEqual({ fullName: 'Asha Patil', aadhaar: '234123412346' })
  })
  it('rejects script injection in names', () => {
    expect(profileSchema.safeParse({ fullName: '<img src=x onerror=alert(1)>', aadhaar: '234123412346' }).success).toBe(false)
    expect(sanitize('a<b>"c"')).toBe('abc')
  })
  it('accepts Devanagari names', () => {
    expect(profileSchema.safeParse({ fullName: 'आशा पाटील', aadhaar: '234123412346' }).success).toBe(true)
  })
  it('bank account must match confirmation and IFSC format', () => {
    expect(bankSchema.safeParse({ bankName: 'SBI', ifsc: 'sbin0001234', loanAccount: '12345678', loanAccountConfirm: '12345678' }).success).toBe(true)
    expect(bankSchema.safeParse({ bankName: 'SBI', ifsc: 'SBIN0001234', loanAccount: '12345678', loanAccountConfirm: '12345679' }).success).toBe(false)
    expect(bankSchema.safeParse({ bankName: 'SBI', ifsc: 'SBIN1001234', loanAccount: '12345678', loanAccountConfirm: '12345678' }).success).toBe(false)
  })
  it('loan amounts are bounded', () => {
    expect(loanSchema.safeParse({ loanType: 'home', sanctionAmount: 3000000, outstanding: 2500000, emi: 26000, interestRate: 8.5 }).success).toBe(true)
    expect(loanSchema.safeParse({ loanType: 'home', sanctionAmount: 3000000, outstanding: 9000000, emi: 26000, interestRate: 8.5 }).success).toBe(false)
    expect(loanSchema.safeParse({ loanType: 'home', sanctionAmount: 'abc', outstanding: 1, emi: 1, interestRate: 1 }).success).toBe(false)
  })
})
