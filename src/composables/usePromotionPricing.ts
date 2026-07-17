import { useServicesStore } from '@/stores/services'
import type { Promotion } from '@/types'

// Client-side mirror of the backend pricing logic (src/utils/pricing.js) so the
// admin can *display* promotion-adjusted prices while booking. The backend
// remains authoritative for what actually gets stored on the booking.
export function usePromotionPricing() {
  const servicesStore = useServicesStore()

  // The most recent active promotion that applies to a service slug: either
  // "all" services or an explicit slug list.
  function getApplicablePromotion(serviceSlug?: string): Promotion | null {
    for (const promo of servicesStore.promotions) {
      if (!promo.active) continue
      if (promo.applicableTo === 'all') return promo
      if (Array.isArray(promo.applicableTo) && serviceSlug && promo.applicableTo.includes(serviceSlug)) {
        return promo
      }
    }
    return null
  }

  // Promotion-adjusted price, or null when no promotion applies / price unknown.
  function discountedPrice(price: number | null | undefined, serviceSlug?: string): number | null {
    if (price === null || price === undefined) return null
    const promo = getApplicablePromotion(serviceSlug)
    if (!promo) return null
    return price - Math.round((price * promo.discountPercentage) / 100)
  }

  return { getApplicablePromotion, discountedPrice }
}
