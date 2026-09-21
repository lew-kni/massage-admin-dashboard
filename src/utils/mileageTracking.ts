// Single source of truth for "which trips are missing their mileage" — used by
// the Dashboard nudge, the Bookings list filter, and the Accounting → Expenses
// "Missing mileage" section, so they can never disagree.
//
// A trip counts as missing its mileage when it's a confirmed appointment that
// has already happened, has no MILEAGE expense linked to it, and hasn't been
// marked mileage-exempt (a session with no billable travel).
import type { Booking, Expense } from '@/types'

/** Booking ids that already have at least one mileage expense linked. */
export function bookingIdsWithMileage(expenses: Expense[]): Set<string> {
  const ids = new Set<string>()
  for (const e of expenses) {
    if (e.category === 'MILEAGE' && e.bookingId) ids.add(e.bookingId)
  }
  return ids
}

export function isMissingMileage(b: Booking, withMileage: Set<string>, now: number = Date.now()): boolean {
  return (
    b.status === 'CONFIRMED' &&
    !b.mileageExempt &&
    new Date(b.startTime).getTime() <= now &&
    !withMileage.has(b.id)
  )
}

/** Past confirmed, non-exempt bookings with no mileage logged, newest first. */
export function missingMileageBookings(bookings: Booking[], expenses: Expense[]): Booking[] {
  const withMileage = bookingIdsWithMileage(expenses)
  const now = Date.now()
  return bookings
    .filter((b) => isMissingMileage(b, withMileage, now))
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
}
