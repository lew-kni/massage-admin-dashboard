import { useServicesStore } from '@/stores/services'
import { formatGBP } from '@/utils/money'
import type { Promotion } from '@/types'

// Client-side mirror of the backend pricing logic (src/utils/pricing.js) so the
// admin can *display* promotion-adjusted prices while booking. The backend
// remains authoritative for what actually gets stored on the booking.
export function usePromotionPricing() {
  const servicesStore = useServicesStore()

  // The most recent active PROMOTION that applies to a service slug: either
  // "all" services or an explicit slug list. Vouchers are excluded — they only
  // apply when a code is entered, never automatically.
  function getApplicablePromotion(serviceSlug?: string): Promotion | null {
    for (const promo of servicesStore.promotions) {
      if (!promo.active || promo.kind === 'VOUCHER') continue
      if (promo.applicableTo === 'all') return promo
      if (Array.isArray(promo.applicableTo) && serviceSlug && promo.applicableTo.includes(serviceSlug)) {
        return promo
      }
    }
    return null
  }

  // The discount in pence a promotion/voucher takes off a price (handles both
  // discount types; capped so a price can't go negative). Mirrors the backend's
  // computeDiscount.
  function discountFor(price: number, promo: Promotion): number {
    let discount: number
    if (promo.discountType === 'FIXED') {
      discount = Math.max(0, promo.discountAmount || 0)
    } else {
      discount = Math.round((price * (promo.discountPercentage || 0)) / 100)
    }
    // Optional cap: "50% off, up to £30".
    if (promo.maxDiscountAmount != null) {
      discount = Math.min(discount, Math.max(0, promo.maxDiscountAmount))
    }
    return Math.min(discount, price)
  }

  // Promotion-adjusted price, or null when no promotion applies / price unknown.
  function discountedPrice(price: number | null | undefined, serviceSlug?: string): number | null {
    if (price === null || price === undefined) return null
    const promo = getApplicablePromotion(serviceSlug)
    if (!promo) return null
    return price - discountFor(price, promo)
  }

  return { getApplicablePromotion, discountedPrice, discountFor }
}

// "50% off" or "£10.00 off" — a compact label for either discount type.
// Standalone so list/badge UIs can use it without the store.
export function discountLabel(promo: Pick<Promotion, 'discountType' | 'discountPercentage' | 'discountAmount' | 'maxDiscountAmount'>): string {
  if (promo.discountType === 'FIXED') return `${formatGBP(promo.discountAmount || 0)} off`
  const base = `${promo.discountPercentage || 0}% off`
  return promo.maxDiscountAmount != null ? `${base} (up to ${formatGBP(promo.maxDiscountAmount)})` : base
}
