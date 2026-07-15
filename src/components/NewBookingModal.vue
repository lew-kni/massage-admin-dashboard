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
                  {{ d.minutes }} min{{ d.price !== null && d.price !== undefined ? ` · £${d.price}` : '' }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Date & Time -->
        <div>
          <h3 class="font-semibold text-gray-900 mb-3">Appointment</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input v-model="form.date" type="date" class="input-field" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input v-model="form.time" type="time" class="input-field" required />
            </div>
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
import { reactive, ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { useBookingsStore } from '@/stores/bookings'
import { useServicesStore } from '@/stores/services'
import type { Client, Booking, ServiceDuration } from '@/types'

const props = defineProps<{ client: Client }>()
const emit = defineEmits<{ close: []; saved: [booking: Booking] }>()

const bookingsStore = useBookingsStore()
const servicesStore = useServicesStore()
const loading = ref(false)
const error = ref('')

const selectedServiceId = ref<string>('')
const selectedMinutes = ref<number>(60)

const bookableServices = computed(() =>
  servicesStore.services.filter((s) => s.isActive && s.bookable)
)

const currentService = computed(() =>
  bookableServices.value.find((s) => s.id === selectedServiceId.value)
)

const currentDurations = computed<ServiceDuration[]>(() =>
  (currentService.value?.durations || []).filter((d) => d.isActive !== false)
)

const form = reactive({
  date: format(new Date(), 'yyyy-MM-dd'),
  time: '10:00',
  status: 'CONFIRMED' as 'CONFIRMED' | 'PENDING',
  notes: '',
})

const endTimeLabel = computed(() => {
  if (!form.date || !form.time || !selectedMinutes.value) return ''
  const start = new Date(`${form.date}T${form.time}:00`)
  if (isNaN(start.getTime())) return ''
  const end = new Date(start.getTime() + selectedMinutes.value * 60000)
  return format(end, 'h:mm a')
})

function onServiceChange() {
  // Default to the first duration of the newly selected service
  const first = currentDurations.value[0]
  if (first) selectedMinutes.value = first.minutes
}

async function submitForm() {
  if (!currentService.value) {
    error.value = 'Please select a service'
    return
  }
  if (!form.date || !form.time || !selectedMinutes.value) {
    error.value = 'Please choose a date, time, and duration'
    return
  }

  const start = new Date(`${form.date}T${form.time}:00`)
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
      status: form.status,
      notes: form.notes || undefined,
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
  const first = bookableServices.value[0]
  if (first) {
    selectedServiceId.value = first.id
    const firstDuration = first.durations.find((d) => d.isActive !== false)
    if (firstDuration) selectedMinutes.value = firstDuration.minutes
  }
})
</script>
