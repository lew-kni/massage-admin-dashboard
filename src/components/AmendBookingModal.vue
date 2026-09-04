<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-semibold mb-1">Amend booking</h2>
      <p class="text-gray-600 text-sm mb-4">
        Change the date, time, service or duration. The client will be emailed the updated details.
      </p>

      <div class="space-y-4">
        <!-- Service + Duration -->
        <div v-if="bookableServices.length === 0" class="text-sm text-gray-500">
          No services available. Add one under Services first.
        </div>
        <div v-else class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select v-model="selectedServiceId" class="input-field" @change="onServiceChange">
              <option v-for="s in bookableServices" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select v-model.number="selectedMinutes" class="input-field">
              <option v-for="d in currentDurations" :key="d.id || d.minutes" :value="d.minutes">
                {{ durationLabel(d) }}
              </option>
            </select>
          </div>
        </div>

        <!-- Price + promotion summary for the selected duration -->
        <div v-if="selectedListPrice !== null" class="flex items-center gap-2 text-sm">
          <span class="text-gray-500">Price:</span>
          <template v-if="selectedDiscountedPrice !== null && selectedDiscountedPrice !== selectedListPrice">
            <span class="text-gray-400 line-through">{{ formatGBP(selectedListPrice) }}</span>
            <span class="font-semibold text-gray-900">{{ formatGBP(selectedDiscountedPrice) }}</span>
            <span v-if="currentPromotion" class="badge bg-amber-100 text-amber-800">{{ discountLabel(currentPromotion) }}</span>
          </template>
          <span v-else class="font-semibold text-gray-900">{{ formatGBP(selectedListPrice) }}</span>
        </div>
        <p v-if="hasVoucher" class="text-xs text-gray-500">
          <i class="fas fa-circle-info mr-1"></i>This booking has a promo code / voucher applied, so its price is kept as-is when you change the service or duration.
        </p>

        <!-- Override availability: pick any date (incl. days off) and any time,
             bypassing the availability check and the buffer between appointments. -->
        <label class="flex items-start gap-2 cursor-pointer text-sm text-gray-700">
          <input type="checkbox" v-model="override" class="w-4 h-4 mt-0.5" />
          <span>
            Override availability — book any date &amp; time
            <span class="block text-xs text-gray-500">Use for a day off, hours outside your normal schedule, or a same-household back-to-back. Skips the availability check and the buffer between appointments.</span>
          </span>
        </label>

        <!-- Date -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <AvailabilityDatePicker
              v-model="form.date"
              :duration="selectedMinutes || null"
              :exclude-booking-id="booking.id"
              :allow-unavailable="override"
            />
          </div>
          <div v-if="override">
            <label class="block text-sm font-medium text-gray-700 mb-1">Start time</label>
            <input v-model="form.time" type="time" class="input-field" />
          </div>
        </div>

        <!-- Why this date is (partly) unavailable — a day off, or specific
             blocked-out periods with their reasons. Shown under the date in both
             modes; on override it explains what you're booking over. -->
        <div v-if="!slotsLoading && (dayUnavailableReason || dayBlocks.length)" class="p-2 bg-amber-50 border border-amber-200 rounded space-y-1">
          <p v-if="dayUnavailableReason" class="text-sm text-amber-700">
            <i class="fas fa-circle-info mr-1"></i>{{ dayUnavailableReason }}<span v-if="!override"> — tick “Override availability” above to book anyway.</span>
          </p>
          <p v-for="(bl, i) in dayBlocks" :key="i" class="text-sm text-amber-700">
            <i class="fas fa-ban mr-1"></i>No availability {{ bl.start }}–{{ bl.end }}<span v-if="bl.reason"> · {{ bl.reason }}</span>
          </p>
        </div>

        <!-- Available slots (default) — buffer-aware, excludes this booking so
             its own current time is offered to keep or shift. -->
        <div v-if="!override">
          <label class="block text-sm font-medium text-gray-700 mb-1">Available times</label>
          <p v-if="slotsLoading" class="text-sm text-gray-500">Checking availability…</p>
          <template v-else>
            <div v-if="availableSlots.length > 0" class="flex flex-wrap gap-2">
              <button
                v-for="slot in availableSlots"
                :key="slot"
                type="button"
                @click="form.time = slot"
                :class="['px-3 py-1.5 rounded border text-sm', form.time === slot ? 'bg-sage-600 text-white border-sage-600' : 'border-gray-300 hover:bg-gray-50']"
              >{{ slot }}</button>
            </div>
            <p v-else-if="!dayUnavailableReason && !dayBlocks.length" class="text-sm text-gray-400">No available times on this date.</p>
          </template>
        </div>

        <p v-if="endTimeLabel" class="text-sm text-gray-500">
          Ends at <span class="font-medium">{{ endTimeLabel }}</span> ({{ selectedMinutes }} min)
        </p>
      </div>

      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div class="flex gap-3 mt-6">
        <button @click="$emit('close')" class="btn-secondary flex-1" :disabled="saving">
          Cancel
        </button>
        <button
          @click="confirm"
          :disabled="saving || bookableServices.length === 0"
          class="btn-primary flex-1"
          :class="{ 'opacity-50 cursor-not-allowed': saving || bookableServices.length === 0 }"
        >
          {{ saving ? 'Saving…' : 'Save & notify client' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import type { Booking, ServiceDuration } from '@/types'
import AvailabilityDatePicker from '@/components/AvailabilityDatePicker.vue'
import { apiService } from '@/services/api'
import { useServicesStore } from '@/stores/services'
import { usePromotionPricing, discountLabel } from '@/composables/usePromotionPricing'
import { formatGBP } from '@/utils/money'
import { toLondonInputParts, londonWallTimeToUtc, formatLondonTime } from '@/utils/formatLondon'

const props = defineProps<{
  booking: Booking
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: {
    startTime: string
    endTime: string
    service: string | null
    serviceSlug?: string
    durationMinutes?: number
    override: boolean
  }]
}>()

const servicesStore = useServicesStore()
const { getApplicablePromotion, discountedPrice } = usePromotionPricing()
const error = ref('')

// A promo code / voucher on the booking means the backend keeps the existing
// price when service/duration change, so show that note rather than a new price.
const hasVoucher = computed(() => Boolean(props.booking.promoCodeId))

// Service + duration are chosen from the real catalogue (like New Booking), so an
// amend can't drift onto a service/length that isn't actually offered or priced.
const selectedServiceId = ref<string>('')
const selectedMinutes = ref<number>(60)

// Slot picker (default) vs. override, mirroring the New Booking flow so amends
// can't accidentally overlap another booking. Override lets the admin pick any
// date (incl. days off) and any time, bypassing the availability check + buffer.
const override = ref(false)
const availableSlots = ref<string[]>([])
const slotsLoading = ref(false)
const dayBlocks = ref<Array<{ start: string; end: string; reason: string | null }>>([])
const dayUnavailableReason = ref('')

const bookableServices = computed(() =>
  servicesStore.services.filter((s) => s.isActive && s.bookable)
)
const currentService = computed(() =>
  bookableServices.value.find((s) => s.id === selectedServiceId.value)
)
const currentDurations = computed<ServiceDuration[]>(() =>
  (currentService.value?.durations || []).filter((d) => d.isActive !== false)
)
const currentPromotion = computed(() => getApplicablePromotion(currentService.value?.slug))

function durationLabel(d: ServiceDuration): string {
  const minutes = `${d.minutes} min`
  if (d.price === null || d.price === undefined) return minutes
  const discounted = discountedPrice(d.price, currentService.value?.slug)
  if (discounted !== null && discounted !== d.price) {
    return `${minutes} · ${formatGBP(discounted)} (was ${formatGBP(d.price)})`
  }
  return `${minutes} · ${formatGBP(d.price)}`
}

const selectedDurationData = computed<ServiceDuration | undefined>(() =>
  currentDurations.value.find((d) => d.minutes === selectedMinutes.value)
)
const selectedListPrice = computed<number | null>(() => selectedDurationData.value?.price ?? null)
const selectedDiscountedPrice = computed<number | null>(() =>
  discountedPrice(selectedListPrice.value, currentService.value?.slug)
)

// Prefill the date/time from the booking's current start. Duration is derived
// from the start/end gap (there's no stored duration field).
const { date, time } = toLondonInputParts(props.booking.startTime)
const currentDuration = Math.round(
  (new Date(props.booking.endTime).getTime() - new Date(props.booking.startTime).getTime()) / 60000,
)

const form = reactive({ date, time })

const endTimeLabel = computed(() => {
  if (!form.date || !form.time || !selectedMinutes.value) return ''
  const start = londonWallTimeToUtc(form.date, form.time)
  if (isNaN(start.getTime())) return ''
  const end = new Date(start.getTime() + selectedMinutes.value * 60000)
  return formatLondonTime(end, { hour: 'numeric', minute: '2-digit', hour12: true })
})

function onServiceChange() {
  // Default to the first duration of the newly selected service.
  const first = currentDurations.value[0]
  if (first) selectedMinutes.value = first.minutes
}

// Fetch the day's availability. Always run — even in override mode — so we can
// show WHY a day is unavailable (day off, or a specific blocked-out reason)
// underneath the date. The slot buttons/time-clearing only apply off override.
async function fetchSlots() {
  if (!form.date || !selectedMinutes.value) {
    availableSlots.value = []
    dayBlocks.value = []
    dayUnavailableReason.value = ''
    return
  }
  slotsLoading.value = true
  try {
    const res = await apiService.getSlots(form.date, selectedMinutes.value, props.booking.id)
    availableSlots.value = res.available ? res.slots : []
    dayBlocks.value = res.blocks || []
    dayUnavailableReason.value = res.available ? '' : (res.reason || '')
  } catch {
    availableSlots.value = []
    dayBlocks.value = []
    dayUnavailableReason.value = ''
  } finally {
    slotsLoading.value = false
  }
  // Off override, drop a chosen time that's no longer offered (e.g. after
  // changing duration). In override mode any time is allowed, so leave it.
  if (!override.value && form.time && !availableSlots.value.includes(form.time)) {
    form.time = ''
  }
}

// Re-fetch slots whenever the date/duration changes, or when leaving override
// mode. Turning override off drops any off-grid time so a real slot is re-picked.
watch(override, (on) => {
  if (!on) form.time = ''
  fetchSlots()
})
watch([() => form.date, selectedMinutes], fetchSlots)

onMounted(async () => {
  if (servicesStore.services.length === 0) await servicesStore.fetchServices()
  if (servicesStore.promotions.length === 0) await servicesStore.fetchPromotions()

  // Prefill the service from the booking's stored service name (best-effort —
  // it's a free-text label historically), else the first bookable service.
  const match = bookableServices.value.find(
    (s) => s.name.toLowerCase() === (props.booking.service || '').trim().toLowerCase()
  )
  selectedServiceId.value = (match || bookableServices.value[0])?.id || ''

  // Prefill the duration to the booking's current length when the selected
  // service offers it; otherwise fall back to that service's first duration.
  const durs = currentDurations.value
  const durMatch = durs.find((d) => d.minutes === currentDuration)
  selectedMinutes.value = (durMatch || durs[0])?.minutes ?? currentDuration

  fetchSlots()
})

function confirm() {
  error.value = ''
  if (!currentService.value) {
    error.value = 'Please select a service'
    return
  }
  if (!form.date || !form.time) {
    error.value = 'Pick a date and start time'
    return
  }
  if (!selectedMinutes.value || selectedMinutes.value < 1) {
    error.value = 'Please choose a duration'
    return
  }
  const start = londonWallTimeToUtc(form.date, form.time)
  if (isNaN(start.getTime())) {
    error.value = 'Invalid date or time'
    return
  }
  const end = new Date(start.getTime() + selectedMinutes.value * 60000)
  emit('confirm', {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    service: currentService.value.name,
    serviceSlug: currentService.value.slug,
    durationMinutes: selectedMinutes.value,
    override: override.value,
  })
}
</script>
