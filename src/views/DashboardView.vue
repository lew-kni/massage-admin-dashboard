<template>
  <div class="p-8">
    <div class="mb-8">
      <h1>Dashboard</h1>
      <p class="text-gray-600 mt-2">Welcome back! Here's an overview of your business.</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard label="Total Clients" :value="clientsCount" icon="Users" />
      <StatCard label="Upcoming Bookings" :value="upcomingBookingsCount" icon="Calendar" />
      <StatCard label="This Month" :value="`£${monthlyRevenue}`" icon="TrendingUp" />
      <StatCard label="Pending Inquiries" :value="pendingCount" icon="AlertCircle" />
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Bookings -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold">Recent Bookings</h2>
        </div>
        <div class="card-body">
          <div v-if="recentBookings.length === 0" class="text-gray-500 text-center py-8">
            No bookings yet
          </div>
          <div v-else class="space-y-4">
            <div v-for="booking in recentBookings" :key="booking.id" class="border-b pb-4 last:border-0">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium">{{ booking.client?.firstName }} {{ booking.client?.lastName }}</p>
                  <p class="text-sm text-gray-500">{{ formatDate(booking.startTime) }}</p>
                </div>
                <span :class="['badge', getStatusBadgeClass(booking.status)]">
                  {{ booking.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Clients -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold">Recent Clients</h2>
        </div>
        <div class="card-body">
          <div v-if="recentClients.length === 0" class="text-gray-500 text-center py-8">
            No clients yet
          </div>
          <div v-else class="space-y-4">
            <div v-for="client in recentClients" :key="client.id" class="border-b pb-4 last:border-0">
              <RouterLink :to="`/clients/${client.id}`" class="hover:text-sage-600">
                <p class="font-medium">{{ client.firstName }} {{ client.lastName }}</p>
                <p class="text-sm text-gray-500">{{ client.email }}</p>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { apiService } from '@/services/api'
import type { Booking } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import StatCard from '@/components/StatCard.vue'

const clientsStore = useClientsStore()
const bookings = ref<Booking[]>([])

const clientsCount = computed(() => clientsStore.clients.length)
const upcomingBookingsCount = computed(() =>
  bookings.value.filter((b) => b.status === 'CONFIRMED').length
)
const pendingCount = computed(() =>
  bookings.value.filter((b) => b.status === 'PENDING').length
)
const monthlyRevenue = computed(() => {
  // This is a placeholder - calculate based on your pricing
  return (upcomingBookingsCount.value * 50).toFixed(2)
})

const recentBookings = computed(() => bookings.value.slice(0, 5))
const recentClients = computed(() => clientsStore.clients.slice(0, 5))

function formatDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'badge-success'
    case 'PENDING':
      return 'badge-warning'
    case 'CANCELLED':
      return 'badge-danger'
    default:
      return ''
  }
}

onMounted(async () => {
  await clientsStore.fetchClients()
  try {
    bookings.value = await apiService.getBookings()
  } catch (error) {
    console.error('Failed to fetch bookings:', error)
  }
})
</script>
