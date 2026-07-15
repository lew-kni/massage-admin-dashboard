<template>
  <div :class="['card', pending ? 'border-l-4 border-orange-500' : 'border-l-4 border-green-500']">
    <div class="p-3">
      <!-- Header with Status -->
      <div class="flex justify-between items-center mb-2">
        <div>
          <h3 class="font-semibold text-sm">{{ booking.client.firstName }} {{ booking.client.lastName }}</h3>
          <p class="text-xs text-gray-500">{{ booking.client.email }} • {{ booking.client.phone }}</p>
        </div>
        <div class="flex gap-1">
          <span :class="['badge text-xs', pending ? 'badge-warning' : 'badge-success']">
            {{ booking.status }}
          </span>
          <span :class="['badge text-xs', getPreFormStatusClass(booking.preFormStatus || 'NOT_SENT')]">
            Form: {{ formatPreFormStatus(booking.preFormStatus || 'NOT_SENT') }}
          </span>
        </div>
      </div>

      <!-- Booking Details - Compact -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 pb-2 border-b text-xs">
        <div>
          <p class="text-gray-500">{{ formatDate(booking.startTime) }}</p>
        </div>
        <div>
          <p class="text-gray-500">{{ formatTime(booking.startTime) }}</p>
        </div>
        <div>
          <p class="text-gray-500">{{ calculateDuration(booking.startTime, booking.endTime) }} min</p>
        </div>
        <div>
          <p class="text-gray-500">{{ formatRelativeTime(booking.createdAt) }}</p>
        </div>
      </div>

      <!-- Service - Compact -->
      <div v-if="booking.service" class="mb-2 p-2 bg-gray-50 rounded text-xs">
        <p class="text-gray-700 line-clamp-1"><i class="fas fa-list mr-1"></i>{{ booking.service }}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-1">
        <button
          v-if="pending"
          @click="$emit('confirm', booking)"
          class="btn-primary text-xs flex-1 py-1"
        >
<i class="fas fa-check"></i>
          <span>Confirm</span>
        </button>
        <button
          v-if="pending"
          @click="$emit('reject', booking)"
          class="btn-danger text-xs flex-1 py-1"
        >
          <i class="fas fa-times"></i>
          <span>Reject</span>
        </button>
        <button
          v-else
          @click="$emit('cancel', booking)"
          class="btn-danger text-xs py-1"
        >
          Cancel
        </button>
        <button
          @click="$emit('edit', booking)"
          class="btn-secondary text-xs py-1"
        >
          <i class="fas fa-edit"></i>
          <span>Edit</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format, formatDistanceToNow } from 'date-fns'
import type { Booking } from '@/types'

defineProps<{
  booking: Booking
  pending: boolean
}>()

defineEmits<{
  confirm: [booking: Booking]
  reject: [booking: Booking]
  cancel: [booking: Booking]
  edit: [booking: Booking]
}>()

function formatDate(date: string) {
  return format(new Date(date), 'MMM dd, yyyy')
}

function formatTime(date: string) {
  return format(new Date(date), 'h:mm a')
}

function formatRelativeTime(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function calculateDuration(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
}

function formatPreFormStatus(status: string): string {
  if (!status) return 'Unknown'
  return status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

function getPreFormStatusClass(status: string): string {
  const baseClass = 'text-xs'
  if (status === 'NOT_SENT') return `${baseClass} bg-gray-100 text-gray-800`
  if (status === 'SENT') return `${baseClass} bg-yellow-100 text-yellow-800`
  if (status === 'COMPLETED') return `${baseClass} bg-green-100 text-green-800`
  if (status === 'OVERDUE') return `${baseClass} bg-red-100 text-red-800`
  return baseClass
}
</script>
