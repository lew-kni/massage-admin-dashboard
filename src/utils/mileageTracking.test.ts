import { describe, it, expect } from 'vitest'
import { bookingIdsWithMileage, isMissingMileage, missingMileageBookings } from './mileageTracking'
import type { Booking, Expense } from '@/types'

const DAY = 24 * 60 * 60 * 1000
const past = new Date(Date.now() - DAY).toISOString()
const future = new Date(Date.now() + DAY).toISOString()

function booking(over: Partial<Booking>): Booking {
  return { id: 'b1', status: 'CONFIRMED', startTime: past, ...over } as Booking
}
function mileage(bookingId: string | null): Expense {
  return { id: 'e' + Math.random(), category: 'MILEAGE', bookingId, miles: 10 } as Expense
}

describe('bookingIdsWithMileage', () => {
  it('collects booking ids from linked mileage expenses only', () => {
    const ids = bookingIdsWithMileage([
      mileage('b1'),
      mileage(null),
      { id: 'x', category: 'SUPPLIES', bookingId: 'b2' } as Expense,
    ])
    expect([...ids]).toEqual(['b1'])
  })
})

describe('isMissingMileage', () => {
  const none = new Set<string>()
  it('flags a past confirmed trip with no mileage', () => {
    expect(isMissingMileage(booking({}), none)).toBe(true)
  })
  it('does not flag a trip that already has mileage', () => {
    expect(isMissingMileage(booking({ id: 'b1' }), new Set(['b1']))).toBe(false)
  })
  it('does not flag a mileage-exempt trip', () => {
    expect(isMissingMileage(booking({ mileageExempt: true }), none)).toBe(false)
  })
  it('does not flag a future or non-confirmed trip', () => {
    expect(isMissingMileage(booking({ startTime: future }), none)).toBe(false)
    expect(isMissingMileage(booking({ status: 'PENDING' }), none)).toBe(false)
    expect(isMissingMileage(booking({ status: 'CANCELLED' }), none)).toBe(false)
  })
})

describe('missingMileageBookings', () => {
  it('returns only the trips that need logging, newest first', () => {
    const older = new Date(Date.now() - 3 * DAY).toISOString()
    const bookings = [
      booking({ id: 'a', startTime: older }),
      booking({ id: 'b', startTime: past }),
      booking({ id: 'c', mileageExempt: true }),
      booking({ id: 'd', startTime: future }),
    ]
    const result = missingMileageBookings(bookings, [mileage('b')])
    // b has mileage, c is exempt, d is future → only 'a' remains.
    expect(result.map((x) => x.id)).toEqual(['a'])
  })
})
