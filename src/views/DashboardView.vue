<template>
  <div class="p-8">
    <div class="mb-8">
      <h1>Dashboard</h1>
      <p class="text-gray-600 mt-2">Welcome back! Here's an overview of your business.</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard label="Total Clients" :value="clientsCount" icon="Users" to="/clients" />
      <StatCard label="Upcoming Bookings" :value="upcomingBookingsCount" icon="Calendar" :to="`/bookings?status=CONFIRMED`" />
      <StatCard label="This Month" :value="`£${monthlyRevenue}`" icon="TrendingUp" />
      <StatCard label="Pending Inquiries" :value="pendingCount" icon="AlertCircle" :to="`/bookings?status=PENDING`" />
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Today's Bookings -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold"><i class="fas fa-calendar-day mr-2"></i>Today's Bookings</h2>
        </div>
        <div class="card-body">
          <div v-if="todaysBookings.length === 0" class="text-gray-500 text-center py-8">
            No bookings scheduled for today
          </div>
          <div v-else class="space-y-3">
            <RouterLink
              v-for="booking in todaysBookings"
              :key="booking.id"
              :to="`/bookings/${booking.id}`"
              class="block border-b pb-3 last:border-0 hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold text-sage-600">{{ formatTime(booking.startTime) }}</p>
                  <p class="font-medium">{{ booking.client?.firstName }} {{ booking.client?.lastName }}</p>
                  <p v-if="booking.service" class="text-sm text-gray-500">{{ booking.service }}</p>
                </div>
                <span :class="['badge', getStatusBadgeClass(booking.status)]">
                  {{ booking.status }}
                </span>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>

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
            <RouterLink
              v-for="booking in recentBookings"
              :key="booking.id"
              :to="`/bookings/${booking.id}`"
              class="block border-b pb-4 last:border-0 hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium">{{ booking.client?.firstName }} {{ booking.client?.lastName }}</p>
                  <p class="text-sm text-gray-500">Appointment {{ formatDate(booking.startTime) }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">Booked {{ formatDate(booking.createdAt) }}</p>
                </div>
                <span :class="['badge', getStatusBadgeClass(booking.status)]">
                  {{ booking.status }}
                </span>
              </div>
            </RouterLink>
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
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useClientsStore } from '@/stores/clients'
import { useBookingsStore } from '@/stores/bookings'
import { formatDistanceToNow, format } from 'date-fns'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import { bookingTotal } from '@/utils/bookingTotal'
import StatCard from '@/components/StatCard.vue'

const clientsStore = useClientsStore()
// Shared store rather than this view's own fetch, so the dashboard reflects
// the same (periodically polled, see App.vue) data as the sidebar badges and
// every other view, instead of a snapshot from whenever this page happened
// to last mount.
const bookingsStore = useBookingsStore()
const bookings = computed(() => bookingsStore.bookings)

const clientsCount = computed(() => clientsStore.clients.length)
const upcomingBookingsCount = computed(() => {
  // "Upcoming" = confirmed AND still in the future. Without the time check a
  // confirmed booking that already took place kept counting here. Absolute
  // instant comparison — a past appointment is past regardless of timezone.
  const now = Date.now()
  return bookings.value.filter(
    (b) => b.status === 'CONFIRMED' && new Date(b.startTime).getTime() > now,
  ).length
})
const pendingCount = computed(() =>
  bookings.value.filter((b) => b.status === 'PENDING').length
)
const monthlyRevenue = computed(() => {
  // Sum the as-booked price (promotion-adjusted where one applied) for this
  // month's non-cancelled bookings. Bookings without a captured price count as 0.
  // Compared as London calendar months, not the viewing browser's own timezone.
  const now = toLondonFakeLocalDate(new Date())
  const total = bookings.value.reduce((sum, b) => {
    const start = toLondonFakeLocalDate(b.startTime)
    const inThisMonth =
      start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth()
    if (!inThisMonth || b.status === 'CANCELLED') return sum
    const effective = bookingTotal(b)
    return sum + effective
  }, 0)
  return total.toFixed(2)
})

const todaysBookings = computed(() => {
  // Compared as London calendar days, not the viewing browser's own timezone
  // -- "today" should mean the same thing regardless of where this is viewed from.
  const now = toLondonFakeLocalDate(new Date())
  return bookings.value
    .filter((b) => {
      const start = toLondonFakeLocalDate(b.startTime)
      return (
        b.status !== 'CANCELLED' &&
        start.getFullYear() === now.getFullYear() &&
        start.getMonth() === now.getMonth() &&
        start.getDate() === now.getDate()
      )
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

const recentBookings = computed(() =>
  [...bookings.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
)
const recentClients = computed(() => clientsStore.clients.slice(0, 5))

function formatDate(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

function formatTime(date: string) {
  return format(toLondonFakeLocalDate(date), 'h:mm a')
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
  // App.vue already fetches bookings on login and polls it periodically; only
  // fetch here too if nothing's arrived yet (e.g. this is the very first view
  // rendered, before that initial fetch resolves).
  if (bookingsStore.bookings.length === 0) bookingsStore.fetchBookings()
})
</script>
