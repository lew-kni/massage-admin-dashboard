<template>
  <div v-if="booking" class="fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-lg overflow-y-auto z-50 animate-slideIn">
    <!-- Header -->
    <div class="sticky top-0 bg-gray-50 border-b p-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold">Booking #{{ booking.bookingNumber }}</h2>
      <button @click="closePanel" class="text-gray-500 hover:text-gray-700 text-xl">
        ✕
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-6">
      <!-- Status badges -->
      <div class="flex gap-2">
        <span :class="['px-3 py-1 rounded-full text-xs font-medium', getStatusClass(booking.status)]">
          {{ booking.status }}
        </span>
        <span :class="['px-3 py-1 rounded-full text-xs font-medium', getPreFormStatusClass(booking.preFormStatus)]">
          Form: {{ formatPreFormStatus(booking.preFormStatus) }}
        </span>
      </div>

      <!-- Client Info -->
      <div>
        <h3 class="font-semibold text-sm text-gray-600 mb-2">Client</h3>
        <p class="font-medium">{{ booking.client?.firstName }} {{ booking.client?.lastName }}</p>
        <p class="text-sm text-gray-600">{{ booking.client?.email }}</p>
        <p class="text-sm text-gray-600">{{ booking.client?.phone }}</p>
      </div>

      <!-- Appointment Info -->
      <div>
        <h3 class="font-semibold text-sm text-gray-600 mb-2">Appointment</h3>
        <div class="space-y-1 text-sm">
          <p><span class="text-gray-600">Date:</span> {{ formatDate(booking.startTime) }}</p>
          <p><span class="text-gray-600">Time:</span> {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</p>
          <p><span class="text-gray-600">Duration:</span> {{ calculateDuration(booking.startTime, booking.endTime) }} min</p>
          <p><span class="text-gray-600">Service:</span> {{ booking.service || 'Not specified' }}</p>
        </div>
      </div>

      <!-- Pre-Massage Form Status -->
      <div class="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
        <h3 class="font-semibold text-sm text-blue-900 mb-2">Pre-Massage Form</h3>
        <p class="text-sm text-blue-800">{{ formatPreFormStatus(booking.preFormStatus) }}</p>
        <button v-if="booking.preFormStatus === 'NOT_SENT'" class="mt-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
          Send Form
        </button>
      </div>

      <!-- Notes -->
      <div v-if="booking.notes">
        <h3 class="font-semibold text-sm text-gray-600 mb-2">Notes</h3>
        <p class="text-sm text-gray-700 whitespace-pre-wrap">{{ booking.notes }}</p>
      </div>

      <!-- Actions -->
      <div class="space-y-2 pt-4 border-t">
        <router-link :to="`/bookings/${booking.id}`" class="block w-full text-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium">
          View Full Details
        </router-link>
        <button @click="cancelBooking" class="w-full px-3 py-2 bg-red-50 text-red-600 rounded text-sm hover:bg-red-100 font-medium">
          Cancel Booking
        </button>
      </div>
    </div>

    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50 -z-10" @click="closePanel"></div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import type { Booking } from '@/types'

defineProps<{
  booking: Booking | null
}>()

const emit = defineEmits<{
  close: []
  cancel: [booking: Booking]
}>()

function closePanel() {
  emit('close')
}

function formatDate(date: string): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

function formatTime(date: string): string {
  return format(new Date(date), 'h:mm a')
}

function calculateDuration(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
}

function formatPreFormStatus(status: string): string {
  return status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
}

function getStatusClass(status: string): string {
  const baseClass = 'px-3 py-1 rounded-full text-xs font-medium'
  if (status === 'PENDING') return `${baseClass} bg-yellow-100 text-yellow-800`
  if (status === 'CONFIRMED') return `${baseClass} bg-green-100 text-green-800`
  if (status === 'CANCELLED') return `${baseClass} bg-red-100 text-red-800`
  if (status === 'COMPLETED') return `${baseClass} bg-purple-100 text-purple-800`
  return baseClass
}

function getPreFormStatusClass(status: string): string {
  const baseClass = 'px-2 py-1 rounded text-xs font-medium'
  if (status === 'NOT_SENT') return `${baseClass} bg-gray-100 text-gray-800`
  if (status === 'SENT') return `${baseClass} bg-yellow-100 text-yellow-800`
  if (status === 'COMPLETED') return `${baseClass} bg-green-100 text-green-800`
  if (status === 'OVERDUE') return `${baseClass} bg-red-100 text-red-800`
  return baseClass
}

async function cancelBooking(booking: Booking) {
  if (confirm('Are you sure you want to cancel this booking?')) {
    emit('cancel', booking)
  }
}
</script>

<style scoped>
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out;
}
</style>
