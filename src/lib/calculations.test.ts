import { describe, expect, it } from 'vitest'
import {
  BLOCK_RULES,
  CRORE,
  LAKH,
  amortize,
  buildTenureComparison,
  calculateBlockBreakdown,
  calculateBlockCount,
  calculateEmi,
  calculateInterestSaved,
  calculateNewTenure,
  calculatePlatformTotals,
  calculateRegularPerUser,
  calculateRescueCapacity,
  calculateTargetTotals,
  calculateTypeTotals,
} from './calculations'

describe('block rules match the CEO spec', () => {
  it('education block: 15L + 85L = 1 Cr, 68L rescue, 32L regular', () => {
    const b = calculateBlockBreakdown('education')
    expect(b.totalPool).toBe(1 * CRORE)
    expect(b.borrowerPool).toBe(15 * LAKH)
    expect(b.csrPool).toBe(85 * LAKH)
    expect(b.rescuePool).toBe(68 * LAKH)
    expect(b.regularPool).toBe(32 * LAKH)
    expect(b.borrowerContributionPerUser).toBe(1500)
  })

  it('home block: 30L + 70L = 1 Cr, 56L rescue, 44L regular', () => {
    const b = calculateBlockBreakdown('home')
    expect(b.totalPool).toBe(1 * CRORE)
    expect(b.rescuePool).toBe(56 * LAKH)
    expect(b.regularPool).toBe(44 * LAKH)
    expect(b.borrowerContributionPerUser).toBe(3000)
  })

  it('calculateRegularPerUser: 3200 education, 4400 home', () => {
    expect(calculateRegularPerUser('education')).toBe(3200)
    expect(calculateRegularPerUser('home')).toBe(4400)
  })

  it('calculateRescueCapacity: 22 students, 11 houses', () => {
    expect(calculateRescueCapacity('education')).toBe(22)
    expect(calculateRescueCapacity('home')).toBe(11)
  })

  it('is dynamic: changing the rules changes every derived number', () => {
    const rules = { ...BLOCK_RULES, education: { ...BLOCK_RULES.education, csrPool: 95 * LAKH, borrowerPool: 5 * LAKH } }
    expect(calculateRegularPerUser('education', rules)).toBe(Math.floor((95 * LAKH * 0.2 + 5 * LAKH) / 1000))
    expect(calculateRescueCapacity('education', rules)).toBe(Math.floor((95 * LAKH * 0.8) / (3 * LAKH)))
  })

  it('partial block keeps per-user benefit constant', () => {
    const half = calculateBlockBreakdown('education', 500)
    expect(half.regularPerUser).toBe(3200)
    expect(half.rescuePool).toBe(34 * LAKH)
    expect(half.rescueCapacity).toBe(11)
    expect(calculateBlockBreakdown('home', 0).regularPerUser).toBe(0)
  })

  it('rejects invalid user counts', () => {
    expect(() => calculateBlockBreakdown('home', 1001)).toThrow(RangeError)
    expect(() => calculateBlockBreakdown('home', -1)).toThrow(RangeError)
    expect(() => calculateBlockBreakdown('home', 1.5)).toThrow(RangeError)
  })
})

describe('25 lakh user scale', () => {
  const t = calculateTargetTotals()

  it('5L education users = 500 blocks, 20L home users = 2000 blocks', () => {
    expect(t.users).toBe(25 * LAKH)
    expect(t.byType.education.fullBlocks).toBe(500)
    expect(t.byType.home.fullBlocks).toBe(2000)
    expect(t.blocks).toBe(2500)
  })

  it('monthly pool is 2,500 Cr', () => {
    expect(t.monthlyPool).toBe(2500 * CRORE)
    expect(t.byType.education.totalPool).toBe(500 * CRORE)
    expect(t.byType.home.totalPool).toBe(2000 * CRORE)
  })

  it('rescues 11,000 students + 22,000 houses = 33,000 cases per month', () => {
    expect(t.byType.education.rescueCapacity).toBe(11_000)
    expect(t.byType.home.rescueCapacity).toBe(22_000)
    expect(t.monthlyRescueCapacity).toBe(33_000)
  })

  it('regular pools: 160 Cr education, 880 Cr home', () => {
    expect(t.byType.education.regularPool).toBe(160 * CRORE)
    expect(t.byType.home.regularPool).toBe(880 * CRORE)
    expect(t.monthlyRescuePool + t.monthlyRegularPool).toBe(t.monthlyPool)
  })

  it('handles a live count with a partial block', () => {
    const c = calculateBlockCount('education', 12_345)
    expect(c).toEqual({ fullBlocks: 12, partialBlockUsers: 345, totalBlocks: 13 })
    const tt = calculateTypeTotals('education', 12_345)
    expect(tt.regularPool).toBe(Math.round(12_345 * 3200))
    const p = calculatePlatformTotals({ education: 0, home: 0 })
    expect(p.monthlyPool).toBe(0)
    expect(p.monthlyRescueCapacity).toBe(0)
  })
})

describe('loan maths', () => {
  it('calculateEmi matches the standard formula (10L, 9%, 120 months)', () => {
    expect(calculateEmi(10 * LAKH, 9, 120)).toBe(12668)
    expect(calculateEmi(1200, 0, 12)).toBe(100)
  })

  it('original EMI closes the loan in its original tenure', () => {
    const emi = calculateEmi(10 * LAKH, 9, 120)
    expect(calculateNewTenure(10 * LAKH, 9, emi, 0)).toBe(120)
  })

  it('extra Rs 3,200 / month shortens a 10L education loan', () => {
    const emi = calculateEmi(10 * LAKH, 9, 120)
    const months = calculateNewTenure(10 * LAKH, 9, emi, 3200)
    expect(months).toBeLessThan(120)
    expect(months).toBeGreaterThan(80)
    const s = calculateInterestSaved(10 * LAKH, 9, emi, 3200)
    expect(s.oldMonths).toBe(120)
    expect(s.newMonths).toBe(months)
    expect(s.interestSaved).toBeGreaterThan(1 * LAKH)
    expect(s.oldInterest - s.newInterest).toBe(s.interestSaved)
  })

  it('extra Rs 4,400 / month on a 30L, 8.5%, 20 year home loan', () => {
    const emi = calculateEmi(30 * LAKH, 8.5, 240)
    const s = calculateInterestSaved(30 * LAKH, 8.5, emi, 4400)
    expect(s.oldMonths).toBe(240)
    expect(s.newMonths).toBeLessThan(200)
    expect(s.interestSaved).toBeGreaterThan(5 * LAKH)
  })

  it('returns Infinity when EMI does not cover interest', () => {
    expect(calculateNewTenure(10 * LAKH, 12, 5000, 0)).toBe(Infinity)
    expect(calculateInterestSaved(10 * LAKH, 12, 5000, 6000).interestSaved).toBe(Infinity)
  })

  it('handles a zero balance and a zero rate', () => {
    expect(calculateNewTenure(0, 9, 1000, 0)).toBe(0)
    expect(calculateNewTenure(12_000, 0, 1000, 0)).toBe(12)
    expect(calculateNewTenure(12_000, 0, 1000, 1000)).toBe(6)
  })

  it('rejects negative or non-finite input', () => {
    expect(() => amortize({ principal: -1, annualRatePct: 9, emi: 100 })).toThrow(RangeError)
    expect(() => amortize({ principal: 1, annualRatePct: NaN, emi: 100 })).toThrow(RangeError)
  })

  it('tenure comparison curve is bounded and ends at zero', () => {
    const emi = calculateEmi(10 * LAKH, 9, 120)
    const pts = buildTenureComparison({ principal: 10 * LAKH, annualRatePct: 9, emi }, 3200)
    expect(pts.length).toBeLessThanOrEqual(62)
    expect(pts[0]).toMatchObject({ month: 0, withoutKarjmukt: 10 * LAKH, withKarjmukt: 10 * LAKH })
    expect(pts.at(-1)).toMatchObject({ month: 120, withoutKarjmukt: 0, withKarjmukt: 0 })
  })
})
