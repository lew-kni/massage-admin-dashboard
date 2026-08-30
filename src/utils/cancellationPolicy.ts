// Mirror of the backend cancellation policy (massage-website-backend
// src/utils/cancellationPolicy.js), used only to pre-fill the suggested fee in
// the cancel dialog. The backend remains the source of truth — whatever the
// therapist confirms is sent to it and stored.
//
//   > 24h notice ............ no charge
//   12–24h notice ........... 50% of price
//   < 12h notice / no-show .. 100% of price
import type { Booking } from '@/types'

interface Tier {
  test: (hours: number) => boolean
  percent: number
  label: string
}

const TIERS: Tier[] = [
  { test: (h) => h > 24, percent: 0, label: "more than 24 hours' notice" },
  { test: (h) => h >= 12, percent: 50, label: '12–24 hours’ notice' },
  { test: () => true, percent: 100, label: 'less than 12 hours’ notice (or no-show)' },
]

export function effectivePrice(booking: Booking): number | null {
  const p = booking.discountedPrice ?? booking.price
  return p === null || p === undefined ? null : Number(p)
}

export function noticeHours(booking: Booking, now: Date = new Date()): number {
  return (new Date(booking.startTime).getTime() - now.getTime()) / (1000 * 60 * 60)
}

export interface CancellationSuggestion {
  hoursNotice: number
  percent: number
  tierLabel: string
  /** Pence, 0 for the free tier, null when the booking has no price on file. */
  amount: number | null
}

export function suggestedCancellationFee(
  booking: Booking,
  now: Date = new Date(),
): CancellationSuggestion {
  const hours = noticeHours(booking, now)
  const tier = TIERS.find((t) => t.test(hours)) ?? TIERS[TIERS.length - 1]
  const price = effectivePrice(booking)
  const amount =
    tier.percent === 0 ? 0 : price === null ? null : Math.round((tier.percent / 100) * price)
  return { hoursNotice: hours, percent: tier.percent, tierLabel: tier.label, amount }
}

// "26 hours", "3 hours", "45 minutes" — a friendly notice figure for the dialog.
export function formatNotice(hours: number): string {
  if (hours < 0) return 'the appointment has already started'
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  const h = Math.round(hours)
  return `${h} ${h === 1 ? 'hour' : 'hours'}`
}
