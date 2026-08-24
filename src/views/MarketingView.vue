<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
      <div>
        <h1>Subscribers</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          People who opted in to marketing emails on the booking or enquiry form.
          <span class="font-medium text-gray-900 dark:text-gray-100">{{ store.subscribedCount }}</span>
          currently subscribed.
        </p>
      </div>
      <button
        @click="exportCsv"
        class="btn-secondary text-sm"
        :disabled="store.contacts.length === 0"
      >
        <i class="fas fa-file-arrow-down mr-1"></i>Export CSV
      </button>
    </div>

    <!-- Filter -->
    <div class="flex items-center gap-2 mb-4 text-sm">
      <button
        v-for="opt in filters"
        :key="opt.value"
        @click="setFilter(opt.value)"
        class="px-3 py-1.5 rounded-full border transition-colors"
        :class="filter === opt.value
          ? 'bg-sage-600 border-sage-600 text-white'
          : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-sage-50 dark:hover:bg-gray-800'"
      >
        {{ opt.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading && store.contacts.length === 0" class="card p-8 text-center text-gray-500">
      Loading…
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="card p-8 bg-red-50 border-red-200 text-red-700">
      {{ store.error }}
    </div>

    <!-- Empty -->
    <div v-else-if="store.contacts.length === 0" class="card p-8 text-center text-gray-500">
      <i class="fas fa-envelope-open-text text-2xl mb-2"></i>
      <p>No contacts here yet. They'll appear as people opt in on the booking or enquiry form.</p>
    </div>

    <!-- Table -->
    <div v-else class="card">
      <div class="card-body">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                <th class="px-3 py-2 font-semibold">Name</th>
                <th class="px-3 py-2 font-semibold">Email</th>
                <th class="px-3 py-2 font-semibold">Status</th>
                <th class="px-3 py-2 font-semibold">Source</th>
                <th class="px-3 py-2 font-semibold">Opted in</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in store.contacts" :key="c.id" class="border-b border-gray-100 dark:border-gray-800 text-sm">
                <td class="px-3 py-2">{{ c.name || '—' }}</td>
                <td class="px-3 py-2">
                  <a :href="`mailto:${c.email}`" class="text-sage-600 hover:underline">{{ c.email }}</a>
                </td>
                <td class="px-3 py-2">
                  <MarketingStatusBadge :status="c.status" />
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ sourceLabel(c.source) }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ formatDate(c.subscribedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { useMarketingStore, type MarketingFilter } from '@/stores/marketing'
import MarketingStatusBadge from '@/components/MarketingStatusBadge.vue'

const store = useMarketingStore()

const filters: { value: MarketingFilter; label: string }[] = [
  { value: 'SUBSCRIBED', label: 'Subscribed' },
  { value: 'UNSUBSCRIBED', label: 'Unsubscribed' },
  { value: 'all', label: 'All' },
]
const filter = ref<MarketingFilter>('SUBSCRIBED')

function setFilter(value: MarketingFilter) {
  if (filter.value === value) return
  filter.value = value
  store.fetchContacts(value)
}

function sourceLabel(source: string | null): string {
  if (source === 'booking-form') return 'Booking form'
  if (source === 'enquiry-form') return 'Enquiry form'
  return source || '—'
}

function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

function exportCsv() {
  const header = ['Name', 'Email', 'Status', 'Source', 'Opted in', 'Unsubscribed']
  const rows = store.contacts.map((c) => [
    c.name || '',
    c.email,
    c.status,
    sourceLabel(c.source),
    formatDate(c.subscribedAt),
    c.unsubscribedAt ? formatDate(c.unsubscribedAt) : '',
  ])
  const escape = (cell: string) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `marketing-${filter.value.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  store.fetchContacts(filter.value)
})
</script>
