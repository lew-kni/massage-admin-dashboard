<template>
  <div class="p-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <RouterLink to="/bookings" class="text-sage-600 hover:text-sage-700">
        ← Back to Bookings
      </RouterLink>
      <div v-if="booking" class="flex items-center gap-3">
        <button v-if="!isEditing" @click="isEditing = true" class="btn-secondary text-sm">
          ✎ Edit
        </button>
        <template v-else>
          <button @click="saveBooking" :disabled="saving" class="btn-primary text-sm">
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button @click="cancelEdit" class="btn-secondary text-sm">
            Cancel
          </button>
        </template>
      </div>
    </div>

    <!-- Save Error -->
    <div v-if="saveError" class="mb-6 p-3 bg-red-50 border border-red-200 rounded">
      <p class="text-sm text-red-700">{{ saveError }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="bookingsStore.loading && !booking" class="text-center py-12">
      <p class="text-gray-500">Loading booking details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!booking" class="card p-8 bg-red-50 border-red-200">
      <p class="text-red-700">Booking not found.</p>
    </div>

    <!-- Booking Details -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Booking Information Card -->
        <div class="card">
          <div class="card-header flex justify-between items-start">
            <div>
              <h2 class="text-2xl font-semibold">Booking #{{ booking.bookingNumber }}</h2>
              <p class="text-gray-500 text-sm mt-1">Created {{ formatRelative(booking.createdAt) }}</p>
            </div>
            <span :class="['badge', getStatusClass(booking.status)]">
              {{ booking.status }}
            </span>
          </div>
          <div class="card-body space-y-6">
            <!-- Client Information -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <h3 class="font-semibold text-gray-900">Client Information</h3>
                <RouterLink
                  v-if="booking.clientId"
                  :to="`/clients/${booking.clientId}`"
                  class="text-sage-600 hover:text-sage-700 text-sm font-medium"
                >
                  View Profile →
                </RouterLink>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Name</p>
                  <p class="font-medium">{{ booking.client?.firstName }} {{ booking.client?.lastName }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Email</p>
                  <p class="font-medium">
                    <a v-if="booking.client?.email" :href="`mailto:${booking.client.email}`" class="text-sage-600 hover:underline break-all">
                      {{ booking.client.email }}
                    </a>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Phone</p>
                  <p class="font-medium">
                    <a v-if="booking.client?.phone" :href="`tel:${booking.client.phone}`" class="text-sage-600 hover:underline">
                      {{ booking.client.phone }}
                    </a>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
                <div class="col-span-2">
                  <p class="text-sm text-gray-500">Address</p>
                  <p class="font-medium whitespace-pre-line">
                    <span v-if="clientAddress">{{ clientAddress }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Appointment Details -->
            <div class="border-t pt-6">
              <h3 class="font-semibold text-gray-900 mb-3">Appointment Details</h3>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-sm text-gray-500">Date</label>
                    <p v-if="!isEditing" class="font-medium">{{ formatDate(booking.startTime) }}</p>
                    <input v-else v-model="editForm.startDate" type="date" class="input-field mt-1" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-500">Start Time</label>
                    <p v-if="!isEditing" class="font-medium">{{ formatTime(booking.startTime) }}</p>
                    <input v-else v-model="editForm.startTime" type="time" class="input-field mt-1" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-500">Duration</label>
                    <p v-if="!isEditing" class="font-medium">{{ calculateDuration(booking.startTime, booking.endTime) }} minutes</p>
                    <input v-else v-model="editForm.duration" type="number" class="input-field mt-1" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-500">Service</label>
                    <p v-if="!isEditing" class="font-medium">
                      <span v-if="booking.service">{{ booking.service }}</span>
                      <span v-else class="text-gray-400">Not provided</span>
                    </p>
                    <input v-else v-model="editForm.service" type="text" class="input-field mt-1" />
                  </div>
                </div>
                <div v-if="isEditing">
                  <label class="text-sm text-gray-500">Status</label>
                  <select v-model="editForm.status" class="input-field mt-1">
                    <option>PENDING</option>
                    <option>CONFIRMED</option>
                    <option>CANCELLED</option>
                    <option>COMPLETED</option>
                  </select>
                </div>
                <div>
                  <label class="text-sm text-gray-500">Notes</label>
                  <p v-if="!isEditing" class="font-medium whitespace-pre-wrap">
                    <span v-if="booking.notes">{{ booking.notes }}</span>
                    <span v-else class="text-gray-400">Not provided</span>
                  </p>
                  <textarea v-else v-model="editForm.notes" class="input-field mt-1" rows="3"></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Session & Health Details Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold">🩺 Session &amp; Health Details</h2>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm text-gray-500">Pressure preference</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.pressurePreference">{{ formatPressure(booking.pressurePreference) }}</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <select v-else v-model="editForm.pressurePreference" class="input-field mt-1">
                  <option value="">—</option>
                  <option value="gentle">Gentle</option>
                  <option value="medium">Medium</option>
                  <option value="firm">Firm</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-500">First massage?</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.firstTime === true">Yes</span>
                  <span v-else-if="booking.firstTime === false">No</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <select v-else v-model="editForm.firstTime" class="input-field mt-1">
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label class="text-sm text-gray-500">Location postcode</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.postcode">{{ booking.postcode }}</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <input v-else v-model="editForm.postcode" type="text" class="input-field mt-1" />
              </div>
              <div>
                <label class="text-sm text-gray-500">Allergies</label>
                <p v-if="!isEditing" class="font-medium">
                  <span v-if="booking.allergies">{{ booking.allergies }}</span>
                  <span v-else class="text-gray-400">Not provided</span>
                </p>
                <input v-else v-model="editForm.allergies" type="text" class="input-field mt-1" />
              </div>
            </div>
            <div class="mt-4">
              <label class="text-sm text-gray-500">Health conditions / injuries</label>
              <p v-if="!isEditing" class="font-medium whitespace-pre-wrap">
                <span v-if="booking.healthConditions">{{ booking.healthConditions }}</span>
                <span v-else class="text-gray-400">Not provided</span>
              </p>
              <textarea v-else v-model="editForm.healthConditions" class="input-field mt-1" rows="3"></textarea>
            </div>
            <div class="mt-4">
              <label class="text-sm text-gray-500">Focus / problem areas</label>
              <p v-if="!isEditing" class="font-medium whitespace-pre-wrap">
                <span v-if="booking.problemAreas">{{ booking.problemAreas }}</span>
                <span v-else class="text-gray-400">Not provided</span>
              </p>
              <textarea v-else v-model="editForm.problemAreas" class="input-field mt-1" rows="2"></textarea>
            </div>
          </div>
        </div>

        <!-- Pre-Massage Form Card -->
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <h2 class="text-lg font-semibold">📋 Pre-Massage Form</h2>
            <span :class="['badge', getPreFormStatusClass(booking.preFormStatus || 'NOT_SENT')]">
              {{ formatPreFormStatus(booking.preFormStatus || 'NOT_SENT') }}
            </span>
          </div>
          <div class="card-body">
            <div class="border-l-4 border-sage-300 pl-4 py-2 space-y-2">
              <p class="text-gray-700 font-medium">Pre massage form question results here</p>
              <p class="text-sm text-gray-500">This section will display the client's pre-massage form responses once they have completed the form.</p>
            </div>
            <button v-if="(booking.preFormStatus || 'NOT_SENT') === 'NOT_SENT'" class="mt-4 btn-primary text-sm">
              ✉️ Send Form to Client
            </button>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Quick Actions</h3>
          </div>
          <div class="card-body space-y-3">
            <button class="btn-primary w-full text-sm">
              ✉️ Send Email
            </button>
            <button class="btn-danger w-full text-sm">
              🗑️ Cancel Booking
            </button>
          </div>
        </div>

        <!-- Details -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">Details</h3>
          </div>
          <div class="card-body space-y-4 text-sm">
            <div>
              <p class="text-gray-500">Booking Number</p>
              <p class="font-medium">#{{ booking.bookingNumber }}</p>
            </div>
            <div>
              <p class="text-gray-500">Status</p>
              <span :class="['badge mt-1', getStatusClass(booking.status)]">
                {{ booking.status }}
              </span>
            </div>
            <div>
              <p class="text-gray-500">Form Status</p>
              <span :class="['badge mt-1', getPreFormStatusClass(booking.preFormStatus || 'NOT_SENT')]">
                {{ formatPreFormStatus(booking.preFormStatus || 'NOT_SENT') }}
              </span>
            </div>
            <div>
              <p class="text-gray-500">Created</p>
              <p class="font-medium">{{ formatDateTime(booking.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Documents -->
        <div class="card">
          <div class="card-header">
            <h3 class="font-semibold">📄 Documents</h3>
          </div>
          <div class="card-body space-y-3">
            <p class="text-sm text-gray-500 text-center py-4">No documents uploaded yet</p>
            <button class="btn-secondary w-full text-sm">
              📎 Upload Document
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useBookingsStore } from '@/stores/bookings'
import type { Booking } from '@/types'
import { format, formatDistanceToNow } from 'date-fns'

const route = useRoute()
const bookingsStore = useBookingsStore()

const booking = ref<Booking | null>(null)

// Full postal address for the client, assembled from address / city / postcode
const clientAddress = computed(() => {
  const c = booking.value?.client
  if (!c) return ''
  return [c.address, c.city, c.postcode]
    .map(part => (part || '').trim())
    .filter(Boolean)
    .join('\n')
})
const isEditing = ref(false)
const saveError = ref('')
const saving = ref(false)
const editForm = reactive({
  startDate: '',
  startTime: '',
  duration: 0,
  service: '',
  status: 'CONFIRMED',
  notes: '',
  postcode: '',
  healthConditions: '',
  problemAreas: '',
  pressurePreference: '' as '' | 'gentle' | 'medium' | 'firm',
  firstTime: '' as '' | 'yes' | 'no',
  allergies: '',
})

function initEditForm() {
  const b = booking.value
  if (!b) return
  editForm.startDate = b.startTime.split('T')[0]
  editForm.startTime = format(new Date(b.startTime), 'HH:mm')
  editForm.duration = calculateDuration(b.startTime, b.endTime)
  editForm.service = b.service || ''
  editForm.status = b.status
  editForm.notes = b.notes || ''
  editForm.postcode = b.postcode || ''
  editForm.healthConditions = b.healthConditions || ''
  editForm.problemAreas = b.problemAreas || ''
  editForm.pressurePreference = (b.pressurePreference as any) || ''
  editForm.firstTime = b.firstTime === true ? 'yes' : b.firstTime === false ? 'no' : ''
  editForm.allergies = b.allergies || ''
}

onMounted(async () => {
  await bookingsStore.fetchBookings()
  const bookingId = route.params.id as string
  booking.value = bookingsStore.bookings.find(b => b.id === bookingId) || null
  initEditForm()
})

function formatPressure(value?: string | null): string {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(date?: string): string {
  if (!date) return ''
  return format(new Date(date), 'MMM dd, yyyy')
}

function formatRelative(date?: string): string {
  if (!date) return ''
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatTime(date?: string): string {
  if (!date) return ''
  return format(new Date(date), 'h:mm a')
}

function formatDateTime(date?: string): string {
  if (!date) return ''
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

function calculateDuration(start?: string, end?: string): number {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
}

function getStatusClass(status?: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'badge-success'
    case 'PENDING':
      return 'badge-warning'
    case 'CANCELLED':
      return 'badge-danger'
    case 'COMPLETED':
      return 'bg-purple-100 text-purple-800'
    default:
      return ''
  }
}

function formatPreFormStatus(status?: string): string {
  if (!status) return 'Unknown'
  return status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

function getPreFormStatusClass(status?: string): string {
  switch (status) {
    case 'NOT_SENT':
      return 'bg-gray-100 text-gray-800'
    case 'SENT':
      return 'bg-yellow-100 text-yellow-800'
    case 'COMPLETED':
      return 'badge-success'
    case 'OVERDUE':
      return 'badge-danger'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

async function saveBooking() {
  if (!booking.value) return
  const start = new Date(`${editForm.startDate}T${editForm.startTime}:00`)
  if (isNaN(start.getTime())) {
    saveError.value = 'Invalid date or time'
    return
  }
  const end = new Date(start.getTime() + Number(editForm.duration) * 60000)

  saving.value = true
  saveError.value = ''
  try {
    const updated = await bookingsStore.updateBooking(booking.value.id, {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: editForm.status as Booking['status'],
      service: editForm.service.trim() || null,
      notes: editForm.notes.trim() || null,
      postcode: editForm.postcode.trim() || null,
      healthConditions: editForm.healthConditions.trim() || null,
      problemAreas: editForm.problemAreas.trim() || null,
      pressurePreference: editForm.pressurePreference || null,
      firstTime: editForm.firstTime === 'yes' ? true : editForm.firstTime === 'no' ? false : null,
      allergies: editForm.allergies.trim() || null,
    })
    booking.value = updated
    isEditing.value = false
  } catch (err: any) {
    saveError.value = err?.message || 'Failed to save booking'
  } finally {
    saving.value = false
  }
}

function cancelEdit() {
  initEditForm()
  saveError.value = ''
  isEditing.value = false
}
</script>
