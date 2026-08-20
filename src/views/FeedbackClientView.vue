<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-6">
      <h1 class="dark:text-gray-50">Feedback</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Private post-visit feedback left by clients from the day-after follow-up email</p>
    </div>

    <div v-if="loading" class="text-sm text-gray-500">Loading…</div>
    <div v-else-if="error" class="text-sm text-red-600"><i class="fas fa-circle-exclamation mr-1"></i>{{ error }}</div>

    <template v-else>
      <!-- Summary -->
      <div v-if="feedback.length" class="flex flex-wrap items-center gap-6 mb-6">
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-semibold">{{ averageRating }}</span>
          <span class="text-yellow-500 text-lg">{{ starString(Math.round(Number(averageRating))) }}</span>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          {{ feedback.length }} {{ feedback.length === 1 ? 'response' : 'responses' }}
        </div>
      </div>

      <div v-if="!feedback.length" class="card max-w-3xl">
        <div class="card-body text-center text-gray-500 py-10">
          No feedback yet. It'll appear here once clients respond to the follow-up email.
        </div>
      </div>

      <ul v-else class="space-y-3 max-w-3xl">
        <li v-for="f in feedback" :key="f.id" class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-yellow-500 text-lg leading-none mb-1" :title="`${f.rating} out of 5`">{{ starString(f.rating) }}</div>
                <router-link
                  v-if="f.client"
                  :to="`/clients/${f.client.id}`"
                  class="text-sm font-medium hover:text-sage-600 hover:underline"
                >{{ f.client.firstName }} {{ f.client.lastName }}</router-link>
                <span v-else class="text-sm font-medium text-gray-500">Unknown client</span>
                <div v-if="f.booking" class="text-xs text-gray-400 mt-0.5">
                  <router-link
                    :to="`/bookings/${f.booking.id}`"
                    class="text-sage-600 hover:underline"
                  >
                    <i class="fas fa-calendar-day mr-1"></i>{{ bookingRef(f.booking) }}
                  </router-link>
                  · {{ serviceLabel(f.booking.service) }} · {{ formatDate(f.booking.startTime) }}
                </div>
              </div>
              <span class="text-xs text-gray-400 whitespace-nowrap">{{ formatDate(f.createdAt) }}</span>
            </div>
            <div v-if="f.wentWell || f.improve" class="mt-3 space-y-3">
              <div v-if="f.wentWell">
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">What went well</div>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ f.wentWell }}</p>
              </div>
              <div v-if="f.improve">
                <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">What I could improve</div>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ f.improve }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-400 italic mt-3">Rating only — no written feedback.</p>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { apiService } from '@/services/api'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import { bookingRef } from '@/utils/bookingTotals'
import type { Feedback } from '@/types'

const feedback = ref<Feedback[]>([])
const loading = ref(true)
const error = ref('')

const averageRating = computed(() => {
  if (!feedback.value.length) return '0.0'
  const sum = feedback.value.reduce((acc, f) => acc + f.rating, 0)
  return (sum / feedback.value.length).toFixed(1)
})

function starString(n: number): string {
  const filled = Math.max(0, Math.min(5, n))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

function serviceLabel(service: string | null): string {
  return (service || 'massage').replace(/-/g, ' ')
}

function formatDate(date: string): string {
  return format(toLondonFakeLocalDate(date), 'dd MMM yyyy')
}

onMounted(async () => {
  try {
    feedback.value = await apiService.getFeedback()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load feedback'
  } finally {
    loading.value = false
  }
})
</script>
