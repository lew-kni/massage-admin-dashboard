// Client-side mirror of the backend's utils/bookingTotals.js so the booking
// detail view can show Gross / Total / Balance without another round trip. The
// backend remains the source of truth (it caches amountPaid/paymentStatus); this
// just derives the display figures from fields the booking already carries.
import type { Booking, PaymentStatus } from '@/types'

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
    // Prefer the backend's cached status when present; fall back to deriving it.
    paymentStatus: b.paymentStatus ?? paymentStatusFor(total, paid),
  }
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash', BACS: 'BACS', CARD: 'Card', VOUCHER: 'Voucher', OTHER: 'Other',
}
export function paymentMethodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method
}

const STATUS_LABELS: Record<PaymentStatus, string> = {
  DUE: 'Unpaid', PART_PAID: 'Part paid', PAID: 'Paid', COMPLIMENTARY: 'Complimentary',
}
export function paymentStatusLabel(status: PaymentStatus): string {
  return STATUS_LABELS[status] ?? status
}
