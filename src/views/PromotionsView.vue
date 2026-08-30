<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ isVoucher ? 'Vouchers' : 'Promotions' }}</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          {{ isVoucher
            ? 'Code-redeemed offers customers type in at checkout — never shown on the site.'
            : 'Discounts applied automatically to matching bookings, and shown on the site.' }}
        </p>
      </div>
      <button @click="createNew" class="btn-primary text-sm shrink-0">
        <i class="fas" :class="isVoucher ? 'fa-ticket' : 'fa-tag'"></i>
        <span>{{ isVoucher ? 'New Voucher' : 'New Promotion' }}</span>
      </button>
    </div>

    <div class="space-y-4">
      <div v-if="store.promotions.length === 0 && store.loading" class="text-center py-12 text-gray-500">
        Loading…
      </div>
      <div v-else-if="visiblePromotions.length === 0" class="card p-12 text-center text-gray-500">
        {{ isVoucher ? 'No vouchers yet.' : 'No promotions yet.' }}
      </div>

      <div v-for="promo in paginatedPromotions" :key="promo.id" class="card" :class="{ 'opacity-60': !promo.active }">
        <div class="card-body flex justify-between items-start gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" @click="editPromotion(promo)">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="badge" :class="promo.active ? 'badge-success' : 'bg-gray-100 text-gray-700'">
                {{ promo.active ? 'Active' : 'Inactive' }}
              </span>
              <span class="badge bg-orange-100 text-orange-800">{{ discountLabel(promo) }}</span>
              <span v-if="promo.firstBookingOnly" class="badge bg-blue-100 text-blue-800" title="First booking only"><i class="fas fa-user-plus mr-1"></i>1st booking</span>
              <span v-if="promo.kind === 'VOUCHER' && promo.code" class="badge bg-gray-100 text-gray-700 font-mono">{{ promo.code }}</span>
              <span v-if="promo.displayAsBanner" class="badge bg-emerald-100 text-emerald-800" title="Shown in the sitewide banner">
                <i class="fas fa-bullhorn mr-1"></i>Banner
              </span>
              <span v-if="promo.internal" class="badge bg-gray-200 text-gray-700" title="Never shown on the website">
                <i class="fas fa-eye-slash mr-1"></i>Internal
              </span>
            </div>
            <p class="font-medium mt-2">{{ promo.name || promo.message }}</p>
            <p v-if="promo.name" class="text-sm text-gray-500">{{ promo.message }}</p>
            <p class="text-sm text-gray-500 mt-1">
              Applies to:
              <span v-if="promo.applicableTo === 'all'">all services</span>
              <span v-else>{{ (promo.applicableTo as string[]).join(', ') }}</span>
              <span v-if="promo.applicableDurations && promo.applicableDurations !== 'all'"> · {{ (promo.applicableDurations as number[]).join(', ') }} min</span>
            </p>
            <p v-if="promo.kind === 'VOUCHER'" class="text-sm text-gray-500 mt-1">
              <span v-if="promo.expiresAt">Expires {{ formatBookingDate(promo.expiresAt) }} · </span>
              Redeemed {{ promo.usageCount ?? 0 }}{{ promo.usageLimit ? ` of ${promo.usageLimit}` : '' }}
            </p>
            <button
              @click.stop="toggleBookings(promo)"
              class="mt-2 text-sm text-sage-600 hover:text-sage-700 font-medium inline-flex items-center gap-1"
            >
              <i class="fas" :class="expandedPromoId === promo.id ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
              <span>{{ promo.bookingCount ?? 0 }} booking{{ (promo.bookingCount ?? 0) === 1 ? '' : 's' }}</span>
            </button>
          </div>
          <i class="fas fa-chevron-right text-gray-300 dark:text-gray-600 mt-1 shrink-0"></i>
        </div>

        <!-- Bookings that used this promotion -->
        <div v-if="expandedPromoId === promo.id" class="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
          <p v-if="loadingPromoBookings" class="text-sm text-gray-500">Loading bookings…</p>
          <p v-else-if="promoBookings.length === 0" class="text-sm text-gray-500">No bookings have used this {{ isVoucher ? 'voucher' : 'promotion' }}.</p>
          <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
            <li v-for="b in promoBookings" :key="b.id" class="py-2 flex items-center justify-between text-sm">
              <RouterLink :to="`/bookings/${b.id}`" class="text-sage-600 hover:text-sage-700 font-medium">
                NPM-{{ b.bookingNumber }}
                <span class="text-gray-500 font-normal">
                  · {{ b.client ? `${b.client.firstName} ${b.client.lastName}` : 'Unknown client' }}
                  · {{ formatBookingDate(b.startTime) }}
                </span>
              </RouterLink>
              <span class="text-gray-700 dark:text-gray-300">
                <span v-if="b.discountedPrice != null && b.price != null && b.discountedPrice !== b.price">
                  <span class="text-gray-400 line-through mr-1">{{ formatGBP(b.price) }}</span>{{ formatGBP(b.discountedPrice) }}
                </span>
                <span v-else-if="b.discountedPrice != null">{{ formatGBP(b.discountedPrice) }}</span>
                <span v-else-if="b.price != null">{{ formatGBP(b.price) }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <Pagination v-model="promotionsPage" :total-pages="promotionsTotalPages" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useServicesStore } from '@/stores/services'
import { apiService } from '@/services/api'
import type { Promotion, PromotionBookingSummary, PromotionKind } from '@/types'
import { discountLabel } from '@/composables/usePromotionPricing'
import { formatGBP } from '@/utils/money'
import Pagination from '@/components/Pagination.vue'

const route = useRoute()
const router = useRouter()
const store = useServicesStore()

// Which kind this page lists — set per-route via meta.kind, so the same
// component serves both the Promotions and Vouchers sub-pages.
const kind = computed<PromotionKind>(() => (route.meta.kind as PromotionKind) || 'PROMOTION')
const isVoucher = computed(() => kind.value === 'VOUCHER')

const visiblePromotions = computed(() => store.promotions.filter((p) => p.kind === kind.value))

const PAGE_SIZE = 10
const promotionsPage = ref(1)
const promotionsTotalPages = computed(() => Math.max(1, Math.ceil(visiblePromotions.value.length / PAGE_SIZE)))
const paginatedPromotions = computed(() =>
  visiblePromotions.value.slice((promotionsPage.value - 1) * PAGE_SIZE, promotionsPage.value * PAGE_SIZE)
)

// Reset paging + any open row when switching between Promotions and Vouchers
// (the component instance is reused across the two routes).
watch(kind, () => {
  promotionsPage.value = 1
  expandedPromoId.value = null
})

function createNew() {
  router.push({ path: '/promotions/new', query: { kind: kind.value } })
}

function editPromotion(promo: Promotion) {
  router.push(`/promotions/${promo.id}`)
}

// Expandable list of bookings that used a promotion (fetched on demand — the
// list endpoint only returns the count).
const expandedPromoId = ref<string | null>(null)
const promoBookings = ref<PromotionBookingSummary[]>([])
const loadingPromoBookings = ref(false)

async function toggleBookings(promo: Promotion) {
  if (expandedPromoId.value === promo.id) {
    expandedPromoId.value = null
    return
  }
  expandedPromoId.value = promo.id
  promoBookings.value = []
  loadingPromoBookings.value = true
  try {
    const full = await apiService.getPromotion(promo.id)
    promoBookings.value = full.bookings || []
  } catch {
    promoBookings.value = []
  } finally {
    loadingPromoBookings.value = false
  }
}

function formatBookingDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  if (store.services.length === 0) store.fetchServices()
  store.fetchPromotions()
})
</script>
