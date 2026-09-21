import { describe, it, expect } from 'vitest'
import {
  estimateSelfEmployedTax,
  PERSONAL_ALLOWANCE,
  BASIC_RATE_LIMIT,
} from './incomeTax'

// Helper: round to the nearest penny for stable comparisons.
const p = (n: number) => Math.round(n * 100) / 100

describe('estimateSelfEmployedTax', () => {
  it('charges nothing on a loss or zero profit', () => {
    expect(estimateSelfEmployedTax(0).total).toBe(0)
    expect(estimateSelfEmployedTax(-500).total).toBe(0)
    expect(estimateSelfEmployedTax(-500).effectiveRate).toBe(0)
  })

  it('charges nothing up to the personal allowance', () => {
    const e = estimateSelfEmployedTax(PERSONAL_ALLOWANCE)
    expect(e.incomeTax).toBe(0)
    expect(e.class4Nic).toBe(0)
    expect(e.total).toBe(0)
  })

  it('applies 20% income tax + 6% Class 4 above the allowance', () => {
    // £20,000 profit: £7,430 over the £12,570 allowance/threshold.
    const e = estimateSelfEmployedTax(20000)
    expect(p(e.incomeTax)).toBe(p(7430 * 0.2)) // 1486
    expect(p(e.class4Nic)).toBe(p(7430 * 0.06)) // 445.80
    expect(p(e.total)).toBe(p(1486 + 445.8))
    expect(e.marginalRate).toBeCloseTo(0.26, 5)
  })

  it('crosses into the 40% band and 2% Class 4 above £50,270', () => {
    const e = estimateSelfEmployedTax(60000)
    const basic = (BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE) * 0.2 // 37,700 @ 20%
    const higher = (60000 - BASIC_RATE_LIMIT) * 0.4 // 9,730 @ 40%
    expect(p(e.incomeTax)).toBe(p(basic + higher))
    const nicMain = (BASIC_RATE_LIMIT - PERSONAL_ALLOWANCE) * 0.06
    const nicUpper = (60000 - BASIC_RATE_LIMIT) * 0.02
    expect(p(e.class4Nic)).toBe(p(nicMain + nicUpper))
    expect(e.marginalRate).toBeCloseTo(0.42, 5)
  })

  it('tapers the personal allowance away above £100k', () => {
    // At £125,140 the allowance is fully gone.
    expect(estimateSelfEmployedTax(125140).personalAllowance).toBe(0)
    // At £110,000 it's reduced by (110000-100000)/2 = 5,000.
    expect(estimateSelfEmployedTax(110000).personalAllowance).toBe(PERSONAL_ALLOWANCE - 5000)
  })

  it('reports an effective rate below the marginal rate', () => {
    const e = estimateSelfEmployedTax(30000)
    expect(e.effectiveRate).toBeLessThan(e.marginalRate)
    expect(e.effectiveRate).toBeGreaterThan(0)
  })
})
