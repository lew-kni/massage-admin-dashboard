import type { ExpenseCategory } from '@/types'

// Kept deliberately plain-English rather than formal accounting terms, but
// chosen to roughly line up with HMRC's self-employment "allowable expenses"
// groupings — a head start on a tax return later without the categories
// themselves needing to change. Mirrors massage-website-backend's
// src/constants/expenseCategories.js.
export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; hint: string; icon: string }[] = [
  { value: 'MILEAGE', label: 'Mileage (car)', hint: "45p/mile for the first 10,000 business miles this tax year, then 25p/mile. Covers fuel and running costs — don't also claim fuel receipts separately.", icon: 'fa-road' },
  { value: 'TRAVEL', label: 'Travel (other)', hint: 'Parking, tolls, public transport — not fuel if you’re claiming mileage above', icon: 'fa-car' },
  { value: 'SUPPLIES', label: 'Equipment & supplies', hint: 'Oils, towels, couch roll, couch, consumables', icon: 'fa-box-open' },
  { value: 'INSURANCE_MEMBERSHIP', label: 'Insurance & membership', hint: 'Balens insurance, SMA membership', icon: 'fa-shield-halved' },
  { value: 'TRAINING', label: 'Training & CPD', hint: 'Courses, qualifications, books', icon: 'fa-graduation-cap' },
  { value: 'MARKETING', label: 'Marketing & website', hint: 'Website, hosting, business cards, ads', icon: 'fa-bullhorn' },
  { value: 'PHONE_ADMIN', label: 'Phone, software & admin', hint: 'Booking system, phone bill, stationery', icon: 'fa-laptop' },
  { value: 'CLOTHING_LAUNDRY', label: 'Clothing & laundry', hint: 'Uniform, laundering towels/linens', icon: 'fa-shirt' },
  { value: 'OTHER', label: 'Other', hint: "Anything that doesn't fit above", icon: 'fa-ellipsis' },
]

export function categoryLabel(value: ExpenseCategory): string {
  return EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}
