<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-6">
      <h1 class="dark:text-gray-50">Feedback</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Your own private notes and reflections on each session</p>
    </div>

    <div v-if="loading" class="text-sm text-gray-500">Loading…</div>
    <div v-else-if="error" class="text-sm text-red-600"><i class="fas fa-circle-exclamation mr-1"></i>{{ error }}</div>

    <template v-else>
      <div v-if="!items.length" class="card max-w-3xl">
        <div class="card-body text-center text-gray-500 py-10">
          No self-feedback yet. Open any booking and use the <span class="font-medium">Self Feedback</span> card to leave yourself notes.
        </div>
      </div>

      <ul v-else class="space-y-3 max-w-3xl">
        <li v-for="s in items" :key="s.id" class="card">
          <div class="card-body">
            <div class="flex items-start justify-between gap-4">
              <div>
                <router-link
                  v-if="s.client"
                  :to="`/clients/${s.client.id}`"
                  class="text-sm font-medium hover:text-sage-600 hover:underline"
                >{{ s.client.firstName }} {{ s.client.lastName }}</router-link>
                <span v-else class="text-sm font-medium text-gray-500">Unknown client</span>
                <div v-if="s.booking" class="text-xs text-gray-400 mt-0.5">
                  <router-link
                    :to="`/bookings/${s.booking.id}`"
                    class="text-sage-600 hover:underline"
                  >
                    <i class="fas fa-calendar-day mr-1"></i>{{ bookingRef(s.booking) }}
                  </router-link>
                  · {{ serviceLabel(s.booking.service) }} · {{ formatDate(s.booking.startTime) }}
                </div>
              </div>
              <span class="text-xs text-gray-400 whitespace-nowrap">{{ formatDate(s.updatedAt) }}</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-3">{{ s.notes }}</p>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { apiService } from '@/services/api'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import { bookingRef } from '@/utils/bookingTotals'
import type { SelfFeedbackListItem } from '@/types'

const items = ref<SelfFeedbackListItem[]>([])
const loading = ref(true)
const error = ref('')

function serviceLabel(service: string | null): string {
  return (service || 'massage').replace(/-/g, ' ')
}

function formatDate(date: string): string {
  return format(toLondonFakeLocalDate(date), 'dd MMM yyyy')
}

onMounted(async () => {
  try {
    items.value = await apiService.getSelfFeedbackList()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load self feedback'
  } finally {
    loading.value = false
  }
})
</script>
