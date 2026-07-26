<template>
  <div class="space-y-4">
    <div v-if="loading" class="card p-8 text-center text-gray-500">Loading history...</div>
    <div v-else-if="communications.length === 0" class="card p-8 text-center text-gray-500">
      No emails sent yet.
    </div>
    <div v-else class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Subject</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Recipient</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Sent</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-gray-700">
            <tr v-for="c in paginatedComms" :key="c.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-6 py-4 font-medium">{{ c.subject }}</td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">
                <RouterLink v-if="c.client" :to="`/clients/${c.clientId}`" class="text-sage-600 hover:underline">
                  {{ c.client.firstName }} {{ c.client.lastName }}
                </RouterLink>
                <span v-else>{{ c.toEmail }}</span>
                <span class="block text-xs text-gray-400">{{ c.toEmail }}</span>
              </td>
              <td class="px-6 py-4 text-gray-600 dark:text-gray-400">{{ formatDateTime(c.sentAt) }}</td>
              <td class="px-6 py-4"><span :class="['badge', statusClass(c.status)]">{{ c.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4">
        <Pagination v-model="currentPage" :total-pages="totalPages" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import { apiService } from '@/services/api'
import type { Communication } from '@/types'
import Pagination from '@/components/Pagination.vue'

const communications = ref<Communication[]>([])
const loading = ref(false)

const PAGE_SIZE = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(communications.value.length / PAGE_SIZE)))
const paginatedComms = computed(() =>
  communications.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE)
)

function formatDateTime(date: string) {
  return format(toLondonFakeLocalDate(date), 'MMM dd, yyyy • h:mm a')
}

function statusClass(status: string) {
  switch (status) {
    case 'SENT': return 'badge-success'
    case 'DRAFT': return 'badge-warning'
    case 'FAILED': return 'badge-danger'
    default: return 'bg-gray-100 text-gray-700'
  }
}

onMounted(async () => {
  loading.value = true
  try {
    communications.value = await apiService.getCommunications()
  } finally {
    loading.value = false
  }
})
</script>
