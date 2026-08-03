import type { Booking } from '@/types'

/**
 * The amount actually charged for a booking: the best (post-discount) price
 * plus any flat extra charge (e.g. a travel surcharge). Single source of truth
 * so displays and revenue totals stay in step. Returns 0 when nothing priced.
 */
export function bookingTotal(
  b: Pick<Booking, 'price' | 'discountedPrice' | 'extraCharge'>
): number {
  const base = b.discountedPrice ?? b.price ?? 0
  return (base || 0) + (b.extraCharge ?? 0)
}
