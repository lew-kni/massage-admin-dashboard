// UK HMRC Approved Mileage Allowance Payment (AMAP) rates for a car, unchanged
// since 2011/12: 45p/mile for the first 10,000 business miles in a tax year,
// 25p/mile after. Mirrors massage-website-backend's src/utils/mileage.js — the
// server is authoritative on save; this is only used for the live estimate
// shown in the expense form before submitting.
export const MILEAGE_RATE_STANDARD_PENCE = 45
export const MILEAGE_RATE_REDUCED_PENCE = 25
export const MILEAGE_THRESHOLD_MILES = 10000

// UK tax year runs 6 April to 5 April.
export function taxYearStart(date: string | Date): Date {
  const d = new Date(date)
  const aprilCutoff = new Date(Date.UTC(d.getUTCFullYear(), 3, 6))
  const startYear = d.getTime() >= aprilCutoff.getTime() ? d.getUTCFullYear() : d.getUTCFullYear() - 1
  return new Date(Date.UTC(startYear, 3, 6))
}

export function taxYearEnd(date: string | Date): Date {
  const start = taxYearStart(date)
  return new Date(Date.UTC(start.getUTCFullYear() + 1, 3, 6))
}

export function calculateMileageAmountPence(milesAlreadyLogged: number, newMiles: number): number {
  const remainingAtStandardRate = Math.max(0, MILEAGE_THRESHOLD_MILES - milesAlreadyLogged)
  const milesAtStandardRate = Math.min(newMiles, remainingAtStandardRate)
  const milesAtReducedRate = newMiles - milesAtStandardRate
  return milesAtStandardRate * MILEAGE_RATE_STANDARD_PENCE + milesAtReducedRate * MILEAGE_RATE_REDUCED_PENCE
}
