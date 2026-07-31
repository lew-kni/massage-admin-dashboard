import { useServicesStore } from '@/stores/services'
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

  // The whole-£ discount a promotion/voucher takes off a price (handles both
  // discount types; capped so a price can't go negative). Mirrors the backend's
  // computeDiscount.
  function discountFor(price: number, promo: Promotion): number {
    if (promo.discountType === 'FIXED') {
      return Math.min(Math.max(0, promo.discountAmount || 0), price)
    }
    return Math.round((price * (promo.discountPercentage || 0)) / 100)
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

// "50% off" or "£10 off" — a compact label for either discount type. Standalone
// so list/badge UIs can use it without the store.
export function discountLabel(promo: Pick<Promotion, 'discountType' | 'discountPercentage' | 'discountAmount'>): string {
  return promo.discountType === 'FIXED'
    ? `£${promo.discountAmount || 0} off`
    : `${promo.discountPercentage || 0}% off`
}
