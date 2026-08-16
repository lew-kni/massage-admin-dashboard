<template>
  <div class="p-8">
    <div class="mb-8">
      <h1>Rebooking</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Who's due back, who's drifting away, and how full your book is.</p>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Active clients</p>
        <p class="text-3xl font-bold text-sage-600 mt-2">{{ activeCount }}</p>
        <p class="text-xs text-gray-500 mt-1">booked or seen within their usual gap</p>
      </div>
      <div class="card p-6">
        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Due to rebook</p>
        <p class="text-3xl font-bold text-amber-600 mt-2">{{ dueCount }}</p>
        <p class="text-xs text-gray-500 mt-1">past their usual gap, nothing booked</p>
      </div>
      <div class="card p-6">
        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Lapsed</p>
        <p class="text-3xl font-bold text-red-600 mt-2">{{ lapsedCount }}</p>
        <p class="text-xs text-gray-500 mt-1">more than twice their usual gap</p>
      </div>
      <div class="card p-6">
        <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg. rebooking gap</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">
          <span v-if="avgIntervalWeeks != null">{{ avgIntervalWeeks.toFixed(1) }}<span class="text-lg font-medium"> wks</span></span>
          <span v-else class="text-gray-400 text-lg">—</span>
        </p>
        <p class="text-xs text-gray-500 mt-1">across clients with 2+ visits</p>
      </div>
    </div>

    <!-- Loading / empty -->
    <div v-if="bookingsStore.loading && bookingsStore.bookings.length === 0" class="card p-8 text-center text-gray-500">
      Loading…
    </div>

    <!-- Due to rebook -->
    <div v-else class="card">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold"><i class="fas fa-user-clock mr-2"></i>Due to rebook</h2>
        <span v-if="dueList.length" class="badge bg-amber-100 text-amber-800">{{ dueList.length }}</span>
      </div>
      <div class="card-body">
        <p class="text-xs text-gray-500 mb-4">Clients with no upcoming booking who are past their usual gap since their last visit — most overdue first.</p>

        <div v-if="dueList.length === 0" class="text-center text-gray-500 py-8">
          <i class="fas fa-circle-check text-emerald-500 text-2xl mb-2"></i>
          <p>Nobody's overdue — everyone active is booked or seen recently.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                <th class="px-3 py-2 font-semibold">Client</th>
                <th class="px-3 py-2 font-semibold">Last visit</th>
                <th class="px-3 py-2 font-semibold text-right">Overdue by</th>
                <th class="px-3 py-2 font-semibold text-right">Visits</th>
                <th class="px-3 py-2 font-semibold text-right">Usual gap</th>
                <th class="px-3 py-2 font-semibold">Status</th>
                <th class="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in pagedDue" :key="c.clientId" class="border-b border-gray-100 dark:border-gray-800 text-sm">
                <td class="px-3 py-2">
                  <RouterLink :to="`/clients/${c.clientId}`" class="text-sage-600 hover:text-sage-700 font-medium">{{ c.name }}</RouterLink>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ c.lastVisit ? formatDate(c.lastVisit) : '—' }}</td>
                <td class="px-3 py-2 text-right whitespace-nowrap" :class="c.status === 'lapsed' ? 'text-red-600 font-medium' : 'text-amber-700'">
                  {{ overdueBy(c) }} days
                </td>
                <td class="px-3 py-2 text-right">{{ c.visitCount }}</td>
                <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{{ c.intervalDays != null ? `${c.intervalDays}d` : '—' }}</td>
                <td class="px-3 py-2">
                  <span :class="['badge', c.status === 'lapsed' ? 'badge-danger' : 'badge-warning']">
                    {{ c.status === 'lapsed' ? 'Lapsed' : 'Due' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right whitespace-nowrap">
                  <a v-if="c.email" :href="`mailto:${c.email}`" class="text-sage-600 hover:text-sage-700 mr-3" title="Email client"><i class="fas fa-envelope"></i></a>
                  <RouterLink :to="`/clients/${c.clientId}`" class="text-sage-600 hover:text-sage-700" title="Open client"><i class="fas fa-arrow-right"></i></RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination v-model="duePage" :total-pages="totalDuePages" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { useBookingsStore } from '@/stores/bookings'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import { computeRebooking, overdueBy } from '@/utils/rebooking'
import Pagination from '@/components/Pagination.vue'

const bookingsStore = useBookingsStore()

// All retention maths lives in the shared util so this page and the Dashboard
// tile stay in lockstep.
const summary = computed(() => computeRebooking(bookingsStore.bookings))
const activeCount = computed(() => summary.value.activeCount)
const dueCount = computed(() => summary.value.dueCount)
const lapsedCount = computed(() => summary.value.lapsedCount)
const avgIntervalWeeks = computed(() => summary.value.avgIntervalWeeks)
// Actionable list: due + lapsed, most overdue first.
const dueList = computed(() => summary.value.toContact)

const PAGE_SIZE = 15
const duePage = ref(1)
const totalDuePages = computed(() => Math.max(1, Math.ceil(dueList.value.length / PAGE_SIZE)))
const pagedDue = computed(() => dueList.value.slice((duePage.value - 1) * PAGE_SIZE, duePage.value * PAGE_SIZE))
watch(totalDuePages, (tp) => { if (duePage.value > tp) duePage.value = tp })

function formatDate(date: string): string {
  return format(toLondonFakeLocalDate(date), 'dd MMM yyyy')
}

onMounted(() => {
  if (bookingsStore.bookings.length === 0) bookingsStore.fetchBookings()
})
</script>
