// Client-side mirror of the backend's utils/bookingTotals.js so the booking
// detail view can show Gross / Total / Balance without another round trip. The
// backend remains the source of truth (it caches amountPaid/paymentStatus); this
// just derives the display figures from fields the booking already carries.
import type { Booking, PaymentMethod, PaymentStatus } from '@/types'

// Client-facing booking reference (matches the backend's bookingRef used in
// emails / BACS references). Display format over the stored integer.
export function bookingRef(b: { bookingNumber: number }): string {
  return `NPM-${b.bookingNumber}`
}

export function grossTotal(b: Booking): number {
  if (b.status === 'CANCELLED') return b.cancellationFee ?? 0
  return (b.price ?? 0) + (Number(b.extraCharge) || 0)
}

// Amount owed: post-discount service total + extra charge, or — for a
// late-cancelled booking — just the cancellation fee.
export function amountDue(b: Booking): number {
  if (b.status === 'CANCELLED') return b.cancellationFee ?? 0
  return (b.discountedPrice ?? b.price ?? 0) + (Number(b.extraCharge) || 0)
}

export function sumPayments(b: Booking): number {
  return (b.payments ?? []).reduce((t, p) => t + (Number(p.amount) || 0), 0)
}

export function paymentStatusFor(total: number, paid: number): PaymentStatus {
  if (total <= 0) return 'COMPLIMENTARY'
  if (paid >= total) return 'PAID'
  if (paid > 0) return 'PART_PAID'
  return 'DUE'
}

export interface BookingTotals {
  grossTotal: number
  total: number
  amountPaid: number
  balance: number
  paymentStatus: PaymentStatus
}

export function computeBookingTotals(b: Booking): BookingTotals {
  const gross = grossTotal(b)
  const total = amountDue(b)
  const paid = sumPayments(b)
  return {
    grossTotal: gross,
    total,
    amountPaid: paid,
    balance: total - paid,
    // When the payment rows are loaded (the detail view), derive the status from
    // the actual charge + payments — that's the definitive value and self-heals
    // a stale cache (e.g. a 100%-discounted booking whose cached status is still
    // DUE because no payment write ever recomputed it). Only fall back to the
    // cached column in list contexts where `payments` isn't loaded.
    // A cancelled/rejected booking owing nothing is always NO_CHARGE, even if a
    // stale cached column still says COMPLIMENTARY from before this rule existed.
    paymentStatus: (b.status === 'CANCELLED' && total <= 0)
      ? 'NO_CHARGE'
      : Array.isArray(b.payments)
        ? paymentStatusFor(total, paid)
        : (b.paymentStatus ?? paymentStatusFor(total, paid)),
  }
}

// --- payment aggregation (cash-basis accounting) ---------------------------
// Income is money actually received, dated by Payment.receivedAt — so these
// flatten every booking's payment rows and bucket by when the money arrived.

export interface DatedPayment {
  amount: number
  method: PaymentMethod
  receivedAt: string
  booking: Booking
}

export function allPayments(bookings: Booking[]): DatedPayment[] {
  return bookings.flatMap((b) =>
    (b.payments ?? []).map((p) => ({ amount: p.amount, method: p.method, receivedAt: p.receivedAt, booking: b })),
  )
}

// Payments received within [startMs, endMs) (by receivedAt). `atMs` maps a
// receivedAt ISO string to the comparable ms — pass a London-local mapper for
// calendar-month bucketing, or the default UTC-instant one.
export function paymentsInRange(
  bookings: Booking[],
  startMs: number,
  endMs: number,
  atMs: (iso: string) => number = (iso) => new Date(iso).getTime(),
): DatedPayment[] {
  return allPayments(bookings).filter((p) => {
    const t = atMs(p.receivedAt)
    return t >= startMs && t < endMs
  })
}

export function sumPaymentsInRange(
  bookings: Booking[],
  startMs: number,
  endMs: number,
  atMs?: (iso: string) => number,
): number {
  return paymentsInRange(bookings, startMs, endMs, atMs).reduce((s, p) => s + p.amount, 0)
}

// Unpaid balance for a booking, never negative (an overpaid/refunded booking
// isn't "outstanding").
export function outstandingBalance(b: Booking): number {
  return Math.max(0, computeBookingTotals(b).balance)
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash', BACS: 'BACS', CARD: 'Card', VOUCHER: 'Voucher', OTHER: 'Other',
}
export function paymentMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  DUE: 'Unpaid', PART_PAID: 'Part paid', PAID: 'Paid', COMPLIMENTARY: 'Complimentary', NO_CHARGE: 'No charge',
}
export function paymentStatusLabel(status: PaymentStatus): string {
  return STATUS_LABELS[status] ?? status
}
