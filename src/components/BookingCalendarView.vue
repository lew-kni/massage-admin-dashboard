<template>
  <div class="space-y-4">
    <!-- Date picker for 1d view -->
    <div class="flex items-center gap-4">
      <label class="text-sm font-medium text-gray-700">Select Date:</label>
      <input v-model="selectedDate" type="date" class="px-3 py-2 border border-gray-300 rounded-md text-sm" />
    </div>

    <!-- Timeline View -->
    <div class="card overflow-x-auto">
      <!-- Time slots header -->
      <div class="flex bg-gray-50 border-b min-w-max">
        <div class="w-32 p-3 bg-white font-semibold text-xs text-center text-gray-700 border-r">Time</div>
        <div v-for="hour in timeSlots" :key="hour" class="w-16 p-2 bg-white font-medium text-xs text-center text-gray-700 border-r">
          {{ formatHour(hour) }}
        </div>
      </div>

      <!-- Unavailable blocks row -->
      <div v-if="dayUnavailableBlocks.length > 0" class="flex bg-gray-100 border-b min-w-max">
        <div class="w-32 p-3 bg-gray-50 font-semibold text-xs text-center text-gray-600 border-r"><i class="fas fa-lock mr-1"></i>Blocked</div>
        <div v-for="hour in timeSlots" :key="'block-' + hour" class="w-16 p-1 bg-white relative border-r">
          <div v-if="hasBlockAt(hour)" class="absolute inset-0 bg-red-100 border-l-4 border-red-500 flex items-center justify-center">
            <span class="text-xs text-red-700 font-medium"><i class="fas fa-square"></i></span>
          </div>
        </div>
      </div>

      <!-- Bookings rows -->
      <div v-if="todayBookings.length > 0">
        <div v-for="booking in todayBookings" :key="booking.id" class="flex bg-white border-b hover:bg-gray-50 min-w-max cursor-pointer" @click="$emit('edit', booking)">
          <div class="w-32 p-3 font-semibold text-xs text-gray-900 border-r" :class="getStatusBorderColor(booking.status)">
            {{ booking.client.firstName.substring(0, 1) }}. {{ booking.client.lastName }}
          </div>
          <div v-for="hour in timeSlots" :key="'booking-' + booking.id + '-' + hour" class="w-16 p-1 relative border-r" :class="bookingSpansHour(booking, hour) ? getBookingBgColor(booking.status) : 'bg-white'">
            <div v-if="bookingSpansHour(booking, hour)" class="text-xs font-medium text-center py-2" v-html="getStatusIcon(booking.status)">
            </div>
          </div>
        </div>
      </div>

      <!-- No bookings message -->
      <div v-else class="flex items-center justify-center min-h-24 bg-gray-50">
        <p class="text-gray-500 text-sm">No bookings scheduled for this day</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Booking } from '@/types'
import type { UnavailableBlock } from '@/types'

interface Props {
  bookings: Booking[]
  unavailableBlocks: UnavailableBlock[]
  viewMode: '1d' | '7d' | '30d'
}

defineProps<Props>()

defineEmits<{
  edit: [booking: Booking]
}>()

const selectedDate = ref(new Date().toISOString().split('T')[0])
const timeSlots = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]

const todayBookings = computed(() => {
  const today = new Date(selectedDate.value)
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  return bookings.filter(b => {
    const bookingStart = new Date(b.startTime)
    return bookingStart >= startOfDay && bookingStart < endOfDay
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const dayUnavailableBlocks = computed(() => {
  const today = new Date(selectedDate.value)
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

  return unavailableBlocks.filter(b => {
    const blockStart = new Date(b.startDate)
    const blockEnd = new Date(b.endDate)
    return blockStart < endOfDay && blockEnd > startOfDay
  })
})

function formatHour(hour: number): string {
  if (hour < 12) return `${hour}a`
  if (hour === 12) return '12p'
  return `${hour - 12}p`
}

function bookingSpansHour(booking: Booking, hour: number): boolean {
  const bookingStart = new Date(booking.startTime)
  const bookingEnd = new Date(booking.endTime)
  return bookingStart.getHours() <= hour && bookingEnd.getHours() > hour
}

function hasBlockAt(hour: number): boolean {
  const today = new Date(selectedDate.value)
  const hourStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour)
  const hourEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour + 1)

  return dayUnavailableBlocks.value.some(b => {
    const blockStart = new Date(b.startDate)
    const blockEnd = new Date(b.endDate)
    return blockStart < hourEnd && blockEnd > hourStart
  })
}

function getStatusBorderColor(booking: Booking): string {
  if (booking.status === 'PENDING') return 'border-l-4 border-orange-500'
  if (booking.status === 'CONFIRMED') return 'border-l-4 border-green-500'
  if (booking.status === 'CANCELLED') return 'border-l-4 border-red-500'
  return 'border-l-4 border-gray-500'
}

function getBookingBgColor(status: string): string {
  if (status === 'PENDING') return 'bg-orange-50'
  if (status === 'CONFIRMED') return 'bg-green-50'
  if (status === 'CANCELLED') return 'bg-red-50'
  return 'bg-gray-50'
}

function getStatusIcon(status: string): string {
  if (status === 'PENDING') return '<i class="fas fa-clock"></i>'
  if (status === 'CONFIRMED') return '<i class="fas fa-check text-green-600"></i>'
  if (status === 'CANCELLED') return '<i class="fas fa-times text-red-600"></i>'
  return '<i class="fas fa-circle text-xs"></i>'
}
</script>
