<template>
  <div>
    <!-- Empty State -->
    <div v-if="bookings.length === 0" class="card p-12 text-center">
      <p class="text-gray-500">No bookings to display</p>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b-2 border-gray-200 bg-gray-50">
            <th class="text-left px-4 py-3 font-semibold text-gray-700 text-sm">#</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Status</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Client</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Email</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Date</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Time</th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 text-sm">Form Status</th>
            <th class="text-right px-4 py-3 font-semibold text-gray-700 text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="booking in bookings"
            :key="booking.id"
            class="border-b border-gray-200 hover:bg-gray-50 transition"
          >
            <td class="px-4 py-3 text-sm">
              <button
                @click="$emit('edit', booking)"
                class="text-sage-600 hover:text-sage-700 font-semibold hover:underline cursor-pointer"
                :title="`Click to view booking #${booking.bookingNumber}`"
              >
                #{{ booking.bookingNumber }}
              </button>
            </td>
            <td class="px-4 py-3 text-sm">
              <span :class="getStatusBadgeClass(booking.status)">
                {{ booking.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <div class="font-medium text-gray-900">{{ booking.client.firstName }} {{ booking.client.lastName }}</div>
              <div v-if="booking.service" class="text-xs text-gray-500 mt-1 line-clamp-1">{{ booking.service }}</div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ booking.client.email }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ formatDate(booking.startTime) }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ formatTime(booking.startTime) }}</td>
            <td class="px-4 py-3 text-sm">
              <span :class="['px-2 py-1 rounded text-xs font-medium', getPreFormStatusClass(booking.preFormStatus || 'NOT_SENT')]">
                {{ formatPreFormStatus(booking.preFormStatus || 'NOT_SENT') }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm">
              <div class="flex justify-end gap-1">
                <button
                  v-if="booking.status === 'PENDING'"
                  @click="$emit('confirm', booking)"
                  class="btn-primary text-xs py-1 px-2 whitespace-nowrap"
                  title="Confirm booking"
                >
<i class="fas fa-check"></i>
                  <span>Confirm</span>
                </button>
                <button
                  v-if="booking.status === 'PENDING'"
                  @click="$emit('reject', booking)"
                  class="btn-danger text-xs py-1 px-2 whitespace-nowrap"
                  title="Reject booking"
                >
                  <i class="fas fa-times"></i>
                  <span>Reject</span>
                </button>
                <button
                  v-else-if="booking.status === 'CONFIRMED' && !isBookingPast(booking)"
                  @click="$emit('cancel', booking)"
                  class="btn-danger text-xs py-1 px-2 whitespace-nowrap"
                  title="Cancel booking"
                >
                  Cancel
                </button>
                <button
                  @click="$emit('edit', booking)"
                  class="btn-secondary text-xs py-1 px-2 whitespace-nowrap"
                  title="Edit booking"
                >
                  <i class="fas fa-edit"></i>
                  <span>Edit</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import type { Booking } from '@/types'

defineProps<{
  bookings: Booking[]
  filterStatus: 'PENDING' | 'ACTIVE' | 'PAST' | 'CANCELLED' | null
}>()

defineEmits<{
  confirm: [booking: Booking]
  reject: [booking: Booking]
  cancel: [booking: Booking]
  edit: [booking: Booking]
}>()

function isBookingPast(booking: Booking): boolean {
  return new Date(booking.startTime) <= new Date()
}

function formatDate(date: string) {
  return format(new Date(date), 'MMM dd, yyyy')
}

function formatTime(date: string) {
  return format(new Date(date), 'h:mm a')
}

function calculateDuration(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
}

function getStatusBadgeClass(status: string) {
  const baseClass = 'badge text-xs'
  if (status === 'PENDING') return `${baseClass} badge-warning`
  if (status === 'CONFIRMED') return `${baseClass} badge-success`
  if (status === 'CANCELLED') return `${baseClass} badge-danger`
  return baseClass
}

function formatPreFormStatus(status: string): string {
  if (!status) return 'Unknown'
  return status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

function getPreFormStatusClass(status: string): string {
  const baseClass = 'text-xs font-medium'
  if (status === 'NOT_SENT') return `${baseClass} bg-gray-100 text-gray-800`
  if (status === 'SENT') return `${baseClass} bg-yellow-100 text-yellow-800`
  if (status === 'COMPLETED') return `${baseClass} bg-green-100 text-green-800`
  if (status === 'OVERDUE') return `${baseClass} bg-red-100 text-red-800`
  return baseClass
}
</script>
