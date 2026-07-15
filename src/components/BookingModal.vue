<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header flex justify-between items-center sticky top-0 bg-white">
        <h2 class="text-lg font-semibold">Edit Booking</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-xmark"></i>
        </button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-6">
        <!-- Client Info (read-only) -->
        <div class="pb-6 border-b">
          <h3 class="font-semibold text-gray-900 mb-3">Client</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">Name</p>
              <p class="font-medium">{{ booking.client.firstName }} {{ booking.client.lastName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="font-medium">{{ booking.client.email }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Phone</p>
              <p class="font-medium">{{ booking.client.phone }}</p>
            </div>
          </div>
        </div>

        <!-- Booking Date & Time -->
        <div>
          <h3 class="font-semibold text-gray-900 mb-3">Appointment Details</h3>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                id="startDate"
                v-model="form.startDate"
                type="date"
                class="input-field"
                required
              />
            </div>
            <div>
              <label for="startTime" class="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                id="startTime"
                v-model="form.startTime"
                type="time"
                class="input-field"
                required
              />
            </div>
            <div>
              <label for="duration" class="block text-sm font-medium text-gray-700 mb-1">
                Duration (min)
              </label>
              <input
                id="duration"
                v-model.number="form.duration"
                type="number"
                min="15"
                step="15"
                class="input-field"
                required
              />
            </div>
          </div>
        </div>

        <!-- Status -->
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select v-model="form.status" class="input-field">
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <!-- Notes -->
        <div>
          <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            class="input-field"
            rows="4"
            placeholder="Add notes about this booking..."
          />
        </div>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 justify-end pt-4 border-t">
          <button
            type="button"
            @click="$emit('close')"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary"
          >
            <span v-if="loading">Saving...</span>
            <template v-else><i class="fas fa-check"></i><span>Save Changes</span></template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useBookingsStore } from '@/stores/bookings'
import { format } from 'date-fns'
import type { Booking } from '@/types'

const emit = defineEmits<{
  close: []
  saved: [booking: Booking]
}>()

const props = defineProps<{
  booking: Booking
}>()

const bookingsStore = useBookingsStore()
const loading = ref(false)
const error = ref('')

const startDate = format(new Date(props.booking.startTime), 'yyyy-MM-dd')
const startTime = format(new Date(props.booking.startTime), 'HH:mm')
const duration = computed(() => {
  const start = new Date(props.booking.startTime)
  const end = new Date(props.booking.endTime)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60))
})

const form = reactive({
  startDate,
  startTime,
  duration: duration.value,
  status: props.booking.status,
  notes: props.booking.notes || '',
})

async function submitForm() {
  if (!form.startDate || !form.startTime || !form.duration) {
    error.value = 'Please fill in all required fields'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const newStartTime = new Date(`${form.startDate}T${form.startTime}:00`).toISOString()
    const newEndTime = new Date(
      new Date(newStartTime).getTime() + form.duration * 60000
    ).toISOString()

    const updated = await bookingsStore.updateBooking(props.booking.id, {
      startTime: newStartTime,
      endTime: newEndTime,
      status: form.status,
      notes: form.notes || undefined,
    })

    emit('saved', updated)
    emit('close')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save booking'
  } finally {
    loading.value = false
  }
}
</script>
