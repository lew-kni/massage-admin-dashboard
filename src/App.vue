<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
    <template v-if="!authStore.isAuthenticated">
      <RouterView />
    </template>
    <template v-else>
      <div class="flex h-screen bg-gray-50 dark:bg-gray-950">
        <!-- Sidebar -->
        <aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col relative">
          <div class="p-6">
            <h1 class="text-2xl font-bold text-sage-600">Fettleworks</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Admin Dashboard</p>
          </div>

          <nav class="mt-6 flex-1">
            <RouterLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.to"
              class="flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-sage-50 dark:hover:bg-gray-800 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
              :class="{ 'bg-sage-50 dark:bg-gray-800 text-sage-600 dark:text-sage-400 border-l-2 border-sage-600': isActive(item.to) }"
            >
              <i :class="['w-5 text-center', item.icon]"></i>
              <span>{{ item.name }}</span>
              <span
                v-if="item.badge"
                class="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.25rem] text-center"
              >
                {{ item.badge }}
              </span>
            </RouterLink>
          </nav>

          <div class="p-6 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <button
              @click="toggleDarkMode"
              class="w-full btn-secondary flex items-center justify-center gap-2"
              :title="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
              <span>{{ isDarkMode ? 'Light' : 'Dark' }}</span>
            </button>
            <button
              @click="logout"
              class="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <i class="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
          <RouterView />
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLeadsStore } from '@/stores/leads'
import { useBookingsStore } from '@/stores/bookings'

const router = useRouter()
const authStore = useAuthStore()
const leadsStore = useLeadsStore()
const bookingsStore = useBookingsStore()
const isDarkMode = ref(false)

const pendingBookingsCount = computed(
  () => bookingsStore.bookings.filter((b) => b.status === 'PENDING').length
)

const navigation = computed(() => [
  { name: 'Dashboard', to: '/', icon: 'fas fa-chart-line' },
  { name: 'Leads', to: '/leads', icon: 'fas fa-inbox', badge: leadsStore.unreadCount },
  { name: 'Clients', to: '/clients', icon: 'fas fa-users' },
  { name: 'Bookings', to: '/bookings', icon: 'fas fa-calendar', badge: pendingBookingsCount.value },
  { name: 'Services', to: '/services', icon: 'fas fa-spa' },
  { name: 'Availability', to: '/availability', icon: 'fas fa-clock' },
  { name: 'Emails', to: '/emails', icon: 'fas fa-envelope' },
])

function isActive(path: string) {
  return router.currentRoute.value.path === path
}

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
  }
}

function logout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  const savedDarkMode = localStorage.getItem('darkMode') === 'true'
  isDarkMode.value = savedDarkMode
  if (savedDarkMode) {
    document.documentElement.classList.add('dark')
  }
})

// Fetch badge data whenever the user is authenticated (including on initial load
// if a session already exists), so nav counts are correct on any page.
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      leadsStore.fetchLeads()
      bookingsStore.fetchBookings()
    }
  },
  { immediate: true }
)
</script>
