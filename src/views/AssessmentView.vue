<template>
  <div class="p-4 sm:p-8 dark:text-gray-50">
    <!-- Header -->
    <div class="max-w-3xl mx-auto">
      <RouterLink
        :to="`/bookings/${bookingId}`"
        class="text-sage-600 hover:text-sage-700 dark:text-sage-400 dark:hover:text-sage-300 text-sm"
      >
        <i class="fas fa-arrow-left mr-1"></i>Back to booking
      </RouterLink>

      <!-- Loading -->
      <div v-if="bookingsStore.loading && !booking" class="text-center py-12">
        <p class="text-gray-500">Loading…</p>
      </div>

      <!-- Not found -->
      <div v-else-if="!booking" class="card p-8 mt-4 bg-red-50 border-red-200">
        <p class="text-red-700">Booking not found.</p>
      </div>

      <template v-else>
        <div class="mt-4 mb-6">
          <h1 class="text-2xl font-semibold">Pre-Massage Assessment</h1>
          <p class="text-gray-500 mt-1">
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ clientName }}</span>
            <span v-if="appointmentLabel"> · {{ appointmentLabel }}</span>
            · Booking #{{ booking.bookingNumber }}
          </p>
        </div>

        <AssessmentSection :booking-id="booking.id" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { format } from 'date-fns'
import { useBookingsStore } from '@/stores/bookings'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import type { Booking } from '@/types'
import AssessmentSection from '@/components/AssessmentSection.vue'

const route = useRoute()
const bookingsStore = useBookingsStore()
const bookingId = route.params.id as string
const booking = ref<Booking | null>(null)

const clientName = computed(() => {
  const c = booking.value?.client
  if (!c) return 'Client'
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Client'
})

const appointmentLabel = computed(() => {
  if (!booking.value?.startTime) return ''
  return format(toLondonFakeLocalDate(booking.value.startTime), 'EEE d MMM yyyy, h:mm a')
})

onMounted(async () => {
  await bookingsStore.fetchBookings()
  booking.value = bookingsStore.bookings.find(b => b.id === bookingId) || null
})
</script>
