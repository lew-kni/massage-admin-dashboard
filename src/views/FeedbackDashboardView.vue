<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-6">
      <h1 class="dark:text-gray-50">Feedback</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Client feedback and your own session notes at a glance</p>
    </div>

    <div v-if="loading" class="text-sm text-gray-500">Loading…</div>
    <div v-else-if="error" class="text-sm text-red-600"><i class="fas fa-circle-exclamation mr-1"></i>{{ error }}</div>

    <template v-else>
      <!-- Stat tiles -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mb-8">
        <div class="card">
          <div class="card-body">
            <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Average client rating</div>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-semibold">{{ averageRating }}</span>
              <span v-if="clientFeedback.length" class="text-yellow-500">{{ starString(Math.round(Number(averageRating))) }}</span>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Client responses</div>
            <div class="text-3xl font-semibold">{{ clientFeedback.length }}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div class="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Self notes</div>
            <div class="text-3xl font-semibold">{{ selfFeedback.length }}</div>
          </div>
        </div>
      </div>

      <!-- Recent from both -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold">Recent client feedback</h2>
            <router-link to="/feedback/client" class="text-sm text-sage-600 hover:underline">View all</router-link>
          </div>
          <div v-if="!clientFeedback.length" class="text-sm text-gray-500">Nothing yet.</div>
          <ul v-else class="space-y-3">
            <li v-for="f in recentClient" :key="f.id" class="card">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <span class="text-yellow-500 text-sm">{{ starString(f.rating) }}</span>
                  <span class="text-xs text-gray-400">{{ formatDate(f.createdAt) }}</span>
                </div>
                <p class="text-sm font-medium mt-1">{{ f.client ? `${f.client.firstName} ${f.client.lastName}` : 'Unknown client' }}</p>
                <router-link v-if="f.booking" :to="`/bookings/${f.booking.id}`" class="text-xs text-sage-600 hover:underline">
                  <i class="fas fa-calendar-day mr-1"></i>{{ bookingRef(f.booking) }}
                </router-link>
                <p v-if="f.wentWell" class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{{ f.wentWell }}</p>
              </div>
            </li>
          </ul>
        </div>

        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold">Recent self notes</h2>
            <router-link to="/feedback/self" class="text-sm text-sage-600 hover:underline">View all</router-link>
          </div>
          <div v-if="!selfFeedback.length" class="text-sm text-gray-500">Nothing yet.</div>
          <ul v-else class="space-y-3">
            <li v-for="s in recentSelf" :key="s.id" class="card">
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Self note</span>
                  <span class="text-xs text-gray-400">{{ formatDate(s.updatedAt) }}</span>
                </div>
                <p class="text-sm font-medium mt-1">{{ s.client ? `${s.client.firstName} ${s.client.lastName}` : 'Unknown client' }}</p>
                <router-link v-if="s.booking" :to="`/bookings/${s.booking.id}`" class="text-xs text-sage-600 hover:underline">
                  <i class="fas fa-calendar-day mr-1"></i>{{ bookingRef(s.booking) }}
                </router-link>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{{ s.notes }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { apiService } from '@/services/api'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import { bookingRef } from '@/utils/bookingTotals'
import type { Feedback, SelfFeedbackListItem } from '@/types'

const clientFeedback = ref<Feedback[]>([])
const selfFeedback = ref<SelfFeedbackListItem[]>([])
const loading = ref(true)
const error = ref('')

const averageRating = computed(() => {
  if (!clientFeedback.value.length) return '—'
  const sum = clientFeedback.value.reduce((acc, f) => acc + f.rating, 0)
  return (sum / clientFeedback.value.length).toFixed(1)
})

const recentClient = computed(() => clientFeedback.value.slice(0, 5))
const recentSelf = computed(() => selfFeedback.value.slice(0, 5))

function starString(n: number): string {
  const filled = Math.max(0, Math.min(5, n))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

function formatDate(date: string): string {
  return format(toLondonFakeLocalDate(date), 'dd MMM yyyy')
}

onMounted(async () => {
  try {
    const [client, self] = await Promise.all([
      apiService.getFeedback(),
      apiService.getSelfFeedbackList(),
    ])
    clientFeedback.value = client
    selfFeedback.value = self
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load feedback'
  } finally {
    loading.value = false
  }
})
</script>
