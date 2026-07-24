<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header flex justify-between items-center sticky top-0 bg-white">
        <h2 class="text-lg font-semibold">New Booking</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-6">
        <!-- Client (read-only) -->
        <div class="pb-6 border-b">
          <h3 class="font-semibold text-gray-900 mb-3">Client</h3>
          <p class="font-medium">{{ client.firstName }} {{ client.lastName }}</p>
          <p class="text-sm text-gray-500">{{ client.email || client.phone || 'No contact details' }}</p>
        </div>

        <!-- Service + Duration -->
        <div>
          <h3 class="font-semibold text-gray-900 mb-3">Service</h3>
          <div v-if="servicesStore.services.length === 0" class="text-sm text-gray-500">
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
          <div v-if="selectedListPrice !== null" class="mt-3 flex items-center gap-2 text-sm">
            <span class="text-gray-500">Price:</span>
            <template v-if="selectedDiscountedPrice !== null && selectedDiscountedPrice !== selectedListPrice">
              <span class="text-gray-400 line-through">£{{ selectedListPrice }}</span>
              <span class="font-semibold text-gray-900">£{{ selectedDiscountedPrice }}</span>
              <span class="badge bg-amber-100 text-amber-800">{{ currentPromotion?.discountPercentage }}% off</span>
            </template>
            <span v-else class="font-semibold text-gray-900">£{{ selectedListPrice }}</span>
          </div>
          <p v-if="currentPromotion" class="mt-1 text-xs text-amber-700">
            <i class="fas fa-tag mr-1"></i>{{ currentPromotion.message }}
          </p>
        </div>

        <!-- Date & Time -->
        <div>
          <h3 class="font-semibold text-gray-900 mb-3">Appointment</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <AvailabilityDatePicker v-model="form.date" :duration="selectedMinutes" :min-date="new Date()" />
            </div>
            <div v-if="customTime">
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Time (custom)</label>
              <input v-model="form.time" type="time" class="input-field" required />
            </div>
          </div>

          <!-- Available slots (default) -->
          <div v-if="!customTime" class="mt-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Available times</label>
            <p v-if="slotsLoading" class="text-sm text-gray-500">Checking availability…</p>
            <template v-else>
              <!-- Day off (weekly schedule) -->
              <div v-if="dayUnavailableReason" class="mb-2 p-2 bg-amber-50 border border-amber-200 rounded">
                <p class="text-sm text-amber-700"><i class="fas fa-circle-info mr-1"></i>{{ dayUnavailableReason }}</p>
              </div>
              <!-- Unavailable blocks covering this date -->
              <div v-if="dayBlocks.length" class="mb-2 p-2 bg-amber-50 border border-amber-200 rounded space-y-1">
                <p v-for="(bl, i) in dayBlocks" :key="i" class="text-sm text-amber-700">
                  <i class="fas fa-ban mr-1"></i>No availability {{ bl.start }}–{{ bl.end }}<span v-if="bl.reason"> · {{ bl.reason }}</span>
                </p>
              </div>

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
            <button type="button" @click="enableCustomTime" class="text-sm text-sage-600 hover:text-sage-700 mt-2 inline-flex items-center gap-1">
              <i class="fas fa-pen"></i><span>Need a custom time?</span>
            </button>
          </div>

          <!-- Custom time mode -->
          <div v-else class="mt-2">
            <p class="text-xs text-amber-600">
              <i class="fas fa-triangle-exclamation mr-1"></i>Custom time bypasses the availability check and the buffer between appointments — for same-household back-to-back sessions or bookings outside your core hours.
            </p>
            <button type="button" @click="disableCustomTime" class="text-sm text-sage-600 hover:text-sage-700 mt-2 inline-flex items-center gap-1">
              <i class="fas fa-arrow-left"></i><span>Choose from available times</span>
            </button>
          </div>

          <p v-if="endTimeLabel" class="text-sm text-gray-500 mt-2">
            Ends at <span class="font-medium">{{ endTimeLabel }}</span> ({{ selectedMinutes }} min)
          </p>
        </div>

        <!-- Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="form.status" class="input-field">
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea v-model="form.notes" rows="3" class="input-field" placeholder="Optional notes about this booking..."></textarea>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="loading || bookableServices.length === 0" class="btn-primary">
            <span v-if="loading">Saving...</span>
            <span v-else>+ Create Booking</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { format } from 'date-fns'
import { useBookingsStore } from '@/stores/bookings'
import { useServicesStore } from '@/stores/services'
import { usePromotionPricing } from '@/composables/usePromotionPricing'
import { apiService } from '@/services/api'
import { londonWallTimeToUtc, formatLondonTime } from '@/utils/formatLondon'
import AvailabilityDatePicker from '@/components/AvailabilityDatePicker.vue'
import type { Client, Booking, ServiceDuration } from '@/types'

const props = defineProps<{ client: Client }>()
const emit = defineEmits<{ close: []; saved: [booking: Booking] }>()

const bookingsStore = useBookingsStore()
const servicesStore = useServicesStore()
const { getApplicablePromotion, discountedPrice } = usePromotionPricing()
const loading = ref(false)
const error = ref('')

const selectedServiceId = ref<string>('')
const selectedMinutes = ref<number>(60)

// Slot picker (default) vs. free-form custom time (manual override)
const customTime = ref(false)
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

// Promotion (if any) that applies to the currently selected service.
const currentPromotion = computed(() => getApplicablePromotion(currentService.value?.slug))

// Label for a duration option, showing the promotion-adjusted price when one applies.
function durationLabel(d: ServiceDuration): string {
  const minutes = `${d.minutes} min`
  if (d.price === null || d.price === undefined) return minutes
  const discounted = discountedPrice(d.price, currentService.value?.slug)
  if (discounted !== null && discounted !== d.price) {
    return `${minutes} · £${discounted} (was £${d.price})`
  }
  return `${minutes} · £${d.price}`
}

// Pricing summary for the selected duration (drives the price line under the times).
const selectedDurationData = computed<ServiceDuration | undefined>(() =>
  currentDurations.value.find((d) => d.minutes === selectedMinutes.value)
)
const selectedListPrice = computed<number | null>(() => selectedDurationData.value?.price ?? null)
const selectedDiscountedPrice = computed<number | null>(() =>
  discountedPrice(selectedListPrice.value, currentService.value?.slug)
)

const form = reactive({
  date: format(new Date(), 'yyyy-MM-dd'),
  time: '10:00',
  status: 'CONFIRMED' as 'CONFIRMED' | 'PENDING',
  notes: '',
})

const endTimeLabel = computed(() => {
  if (!form.date || !form.time || !selectedMinutes.value) return ''
  const start = londonWallTimeToUtc(form.date, form.time)
  if (isNaN(start.getTime())) return ''
  const end = new Date(start.getTime() + selectedMinutes.value * 60000)
  return formatLondonTime(end, { hour: 'numeric', minute: '2-digit', hour12: true })
})

function onServiceChange() {
  // Default to the first duration of the newly selected service
  const first = currentDurations.value[0]
  if (first) selectedMinutes.value = first.minutes
}

async function fetchSlots() {
  if (customTime.value || !form.date || !selectedMinutes.value) {
    availableSlots.value = []
    return
  }
  slotsLoading.value = true
  try {
    const res = await apiService.getSlots(form.date, selectedMinutes.value)
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
  // Drop a chosen time that's no longer offered
  if (form.time && !availableSlots.value.includes(form.time)) {
    form.time = ''
  }
}

function enableCustomTime() {
  customTime.value = true
}

function disableCustomTime() {
  customTime.value = false
  form.time = ''
  fetchSlots()
}

// Re-fetch slots whenever the date or duration changes (slot mode only)
watch([() => form.date, selectedMinutes], fetchSlots)

async function submitForm() {
  if (!currentService.value) {
    error.value = 'Please select a service'
    return
  }
  if (!form.date || !form.time || !selectedMinutes.value) {
    error.value = 'Please choose a date, time, and duration'
    return
  }

  const start = londonWallTimeToUtc(form.date, form.time)
  if (isNaN(start.getTime())) {
    error.value = 'Invalid date or time'
    return
  }
  const end = new Date(start.getTime() + selectedMinutes.value * 60000)

  loading.value = true
  error.value = ''
  try {
    const created = await bookingsStore.createBooking({
      clientId: props.client.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      service: currentService.value.name,
      // Send the slug + duration so the backend can look up the list price and
      // apply any active promotion (authoritative, promotion-aware pricing).
      serviceSlug: currentService.value.slug,
      durationMinutes: selectedMinutes.value,
      status: form.status,
      notes: form.notes || undefined,
      override: customTime.value,
    } as any)
    emit('saved', created)
    emit('close')
  } catch (err: any) {
    error.value = err?.message || 'Failed to create booking'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (servicesStore.services.length === 0) {
    await servicesStore.fetchServices()
  }
  if (servicesStore.promotions.length === 0) {
    await servicesStore.fetchPromotions()
  }
  const first = bookableServices.value[0]
  if (first) {
    selectedServiceId.value = first.id
    const firstDuration = first.durations.find((d) => d.isActive !== false)
    if (firstDuration) selectedMinutes.value = firstDuration.minutes
  }
  await fetchSlots()
})
</script>
