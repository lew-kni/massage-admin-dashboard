import type { ExpenseCategory } from '@/types'

// SA103S — Self-employment (short) — expense boxes, verified against HMRC's
// 2024 SA103S form. The short form is the one that applies while turnover is
// below the VAT threshold (£90,000), and it deliberately lumps several things
// the full SA103F splits out — most notably box 19 "other allowable business
// expenses", which soaks up advertising, training, clothing and anything with
// no dedicated box. That's why our nine plain-English expense categories map
// onto fewer boxes here.
//
// Turnover under £85,000 means you're allowed to skip boxes 11–19 entirely and
// just enter the single total in box 20 (see SIMPLIFIED_TURNOVER_LIMIT).

export interface Sa103sBox {
  box: number
  label: string
}

export const SA103S_EXPENSE_BOXES: Sa103sBox[] = [
  { box: 11, label: 'Cost of goods bought for resale or goods used' },
  { box: 12, label: 'Car, van and travel expenses' },
  { box: 13, label: 'Wages, salaries and other staff costs' },
  { box: 14, label: 'Rent, rates, power and insurance costs' },
  { box: 15, label: 'Repairs and maintenance of property and equipment' },
  { box: 16, label: 'Accountancy, legal and other professional fees' },
  { box: 17, label: 'Interest and bank and credit card financial charges' },
  { box: 18, label: 'Phone, fax, stationery and other office costs' },
  { box: 19, label: 'Other allowable business expenses' },
]

export const TURNOVER_BOX = 9
export const TOTAL_EXPENSES_BOX = 20
export const NET_PROFIT_BOX = 21
export const NET_LOSS_BOX = 22

// Turnover at/above which the single-figure shortcut (box 20 only) stops being
// available and the full breakdown is expected. HMRC's own wording on the form.
export const SIMPLIFIED_TURNOVER_LIMIT = 85000

// Where each of our expense categories lands on the SA103S. A couple are
// judgement calls the short form forces on us (it has no advertising, training
// or subscriptions box) — but the box-20 total is identical however they're
// split, so this only affects the per-box breakdown, never the tax.
export const CATEGORY_TO_SA103S_BOX: Record<ExpenseCategory, number> = {
  SUPPLIES: 11, // oils, towels, couch roll, consumables — "goods used"
  MILEAGE: 12, // AMAP mileage
  TRAVEL: 12, // parking, tolls, public transport
  INSURANCE_MEMBERSHIP: 14, // public liability etc. sits in the insurance box
  PHONE_ADMIN: 18, // phone, booking software, stationery
  MARKETING: 19, // no advertising box on the short form → "other"
  TRAINING: 19, // CPD → "other" (initial qualifications may be disallowable)
  CLOTHING_LAUNDRY: 19, // uniform/laundry → "other"
  OTHER: 19,
}

export function sa103sBoxForCategory(category: ExpenseCategory): number {
  return CATEGORY_TO_SA103S_BOX[category] ?? 19
}

export function sa103sBoxLabel(box: number): string {
  return SA103S_EXPENSE_BOXES.find((b) => b.box === box)?.label ?? `Box ${box}`
}
