import { describe, it, expect } from 'vitest'
import {
  calculateMileageAmountPence,
  taxYearStart,
  taxYearEnd,
  MILEAGE_RATE_STANDARD_PENCE,
  MILEAGE_RATE_REDUCED_PENCE,
  MILEAGE_THRESHOLD_MILES,
} from './mileage'

describe('calculateMileageAmountPence', () => {
  it('charges the standard 45p rate when nothing logged yet', () => {
    expect(calculateMileageAmountPence(0, 100)).toBe(100 * MILEAGE_RATE_STANDARD_PENCE)
  })

  it('stays at the standard rate while under the 10,000 mile threshold', () => {
    expect(calculateMileageAmountPence(5000, 4000)).toBe(4000 * MILEAGE_RATE_STANDARD_PENCE)
  })

  it('drops to the reduced 25p rate once the threshold has already been passed', () => {
    expect(calculateMileageAmountPence(10500, 200)).toBe(200 * MILEAGE_RATE_REDUCED_PENCE)
  })

  it('splits an entry that straddles the 10,000 mile threshold', () => {
    expect(calculateMileageAmountPence(9900, 300)).toBe(
      100 * MILEAGE_RATE_STANDARD_PENCE + 200 * MILEAGE_RATE_REDUCED_PENCE
    )
  })

  it('handles zero new miles', () => {
    expect(calculateMileageAmountPence(0, 0)).toBe(0)
  })

  it('never charges the standard rate beyond the threshold', () => {
    const amount = calculateMileageAmountPence(0, MILEAGE_THRESHOLD_MILES + 500)
    expect(amount).toBe(MILEAGE_THRESHOLD_MILES * MILEAGE_RATE_STANDARD_PENCE + 500 * MILEAGE_RATE_REDUCED_PENCE)
  })
})

describe('taxYearStart / taxYearEnd', () => {
  it('places 5 April in the previous tax year', () => {
    expect(taxYearStart('2026-04-05T12:00:00.000Z').toISOString()).toBe('2025-04-06T00:00:00.000Z')
  })

  it('places 6 April in the new tax year', () => {
    expect(taxYearStart('2026-04-06T00:00:00.000Z').toISOString()).toBe('2026-04-06T00:00:00.000Z')
  })

  it('returns a range ending the following 6 April', () => {
    const date = '2026-07-15T00:00:00.000Z'
    expect(taxYearStart(date).toISOString()).toBe('2026-04-06T00:00:00.000Z')
    expect(taxYearEnd(date).toISOString()).toBe('2027-04-06T00:00:00.000Z')
  })
})
