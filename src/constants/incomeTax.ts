// A rough "how much should I set aside for tax?" estimate for a UK sole trader,
// worked out from taxable profit (turnover minus allowable expenses). This is a
// bookkeeping aid, NOT a filed calculation or tax advice — see the assumptions
// below and the disclaimer shown alongside it in the UI.
//
// Rates are UK 2025/26. Update TAX_YEAR_LABEL and the bands when HMRC changes
// them (each new tax year, usually announced at the Budget).
//
// Assumptions baked in — true for Lew today, worth revisiting if things change:
//   • Self-employment is the only income, so the whole personal allowance and
//     basic-rate band are available against this profit (a PAYE job or pension
//     alongside would push more of it into higher bands — this would then
//     under-estimate).
//   • Class 2 NIC is no longer payable (abolished for the self-employed from
//     2024/25; only voluntary contributions remain), so it's left out.
//   • No student loan, no Gift Aid, no pension relief, standard personal
//     allowance (no marriage allowance transfer).

export const TAX_YEAR_LABEL = '2025/26'

// Income Tax (England/NI/Wales — Scotland differs). Thresholds are frozen.
export const PERSONAL_ALLOWANCE = 12570
export const BASIC_RATE_LIMIT = 50270 // top of the 20% band
export const HIGHER_RATE_LIMIT = 125140 // top of the 40% band; 45% above
export const BASIC_RATE = 0.2
export const HIGHER_RATE = 0.4
export const ADDITIONAL_RATE = 0.45

// The personal allowance tapers away by £1 for every £2 of income over £100,000,
// so it's fully gone by £125,140. Included for completeness even though it's
// unlikely to bite at this scale.
export const ALLOWANCE_TAPER_THRESHOLD = 100000

// Class 4 National Insurance (self-employed), 2025/26.
export const CLASS4_LOWER_LIMIT = 12570 // same as the personal allowance
export const CLASS4_UPPER_LIMIT = 50270
export const CLASS4_MAIN_RATE = 0.06 // between the lower and upper limits
export const CLASS4_UPPER_RATE = 0.02 // above the upper limit

export interface TaxEstimate {
  /** Taxable profit the estimate is based on (pounds). */
  profit: number
  /** Personal allowance actually available after any taper (pounds). */
  personalAllowance: number
  /** Estimated Income Tax (pounds). */
  incomeTax: number
  /** Estimated Class 4 National Insurance (pounds). */
  class4Nic: number
  /** incomeTax + class4Nic — the amount to set aside (pounds). */
  total: number
  /** total as a fraction of profit (0–1); 0 when there's no profit. */
  effectiveRate: number
  /** The rate the next £1 of profit would be taxed at (0–1). */
  marginalRate: number
}

/** The personal allowance left after the £100k taper. */
function availableAllowance(profit: number): number {
  if (profit <= ALLOWANCE_TAPER_THRESHOLD) return PERSONAL_ALLOWANCE
  const reduction = (profit - ALLOWANCE_TAPER_THRESHOLD) / 2
  return Math.max(0, PERSONAL_ALLOWANCE - reduction)
}

function incomeTaxOn(profit: number): number {
  const allowance = availableAllowance(profit)
  const taxable = Math.max(0, profit - allowance)
  if (taxable === 0) return 0

  // Widths of the basic and higher bands, measured from the allowance up.
  const basicBand = Math.max(0, BASIC_RATE_LIMIT - allowance)
  const higherBand = Math.max(0, HIGHER_RATE_LIMIT - BASIC_RATE_LIMIT)

  const atBasic = Math.min(taxable, basicBand)
  const atHigher = Math.min(Math.max(0, taxable - basicBand), higherBand)
  const atAdditional = Math.max(0, taxable - basicBand - higherBand)

  return atBasic * BASIC_RATE + atHigher * HIGHER_RATE + atAdditional * ADDITIONAL_RATE
}

function class4NicOn(profit: number): number {
  if (profit <= CLASS4_LOWER_LIMIT) return 0
  const atMain = Math.min(profit, CLASS4_UPPER_LIMIT) - CLASS4_LOWER_LIMIT
  const atUpper = Math.max(0, profit - CLASS4_UPPER_LIMIT)
  return atMain * CLASS4_MAIN_RATE + atUpper * CLASS4_UPPER_RATE
}

function marginalRateAt(profit: number): number {
  if (profit <= PERSONAL_ALLOWANCE) return 0
  // Income-tax marginal rate.
  let it = BASIC_RATE
  if (profit > HIGHER_RATE_LIMIT) it = ADDITIONAL_RATE
  else if (profit > BASIC_RATE_LIMIT) it = HIGHER_RATE
  // Class 4 marginal rate.
  const nic = profit > CLASS4_UPPER_LIMIT ? CLASS4_UPPER_RATE : CLASS4_MAIN_RATE
  return it + nic
}

/**
 * Estimate the Income Tax + Class 4 NIC due on a year's taxable profit, and
 * therefore roughly how much to set aside. A loss or zero profit returns all
 * zeros. `profit` is in pounds.
 */
export function estimateSelfEmployedTax(profit: number): TaxEstimate {
  const p = Number(profit) || 0
  if (p <= 0) {
    return {
      profit: Math.min(0, p),
      personalAllowance: PERSONAL_ALLOWANCE,
      incomeTax: 0,
      class4Nic: 0,
      total: 0,
      effectiveRate: 0,
      marginalRate: 0,
    }
  }
  const incomeTax = incomeTaxOn(p)
  const class4Nic = class4NicOn(p)
  const total = incomeTax + class4Nic
  return {
    profit: p,
    personalAllowance: availableAllowance(p),
    incomeTax,
    class4Nic,
    total,
    effectiveRate: total / p,
    marginalRate: marginalRateAt(p),
  }
}
