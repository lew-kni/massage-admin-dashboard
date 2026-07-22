<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
    <template v-if="!authStore.isAuthenticated">
      <RouterView />
    </template>
    <template v-else>
      <div class="flex h-screen bg-gray-50 dark:bg-gray-950">
        <!-- Mobile topbar: only the sidebar's own toggle lives below the
             `sidebar` breakpoint (920px) — everything else stays as-is. -->
        <div class="sidebar:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center gap-3 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <button
            @click="sidebarOpen = true"
            class="text-gray-600 dark:text-gray-300 text-xl w-8 h-8 flex items-center justify-center"
            aria-label="Open menu"
          >
            <i class="fas fa-bars"></i>
          </button>
          <img src="/logo.png" alt="North Peak Massage" class="h-8 w-auto" />
        </div>

        <!-- Backdrop, closes the drawer on click -->
        <div
          v-if="sidebarOpen"
          class="sidebar:hidden fixed inset-0 bg-black/50 z-40"
          @click="sidebarOpen = false"
        ></div>

        <!-- Sidebar -->
        <aside
          class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out sidebar:relative sidebar:translate-x-0 sidebar:z-auto"
          :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
        >
          <div class="px-6 pt-6 pb-5 border-b border-gray-100 dark:border-gray-800">
            <!-- In dark mode the logo sits on a light plate rather than being
                 filtered: its wordmark is a deep green that only reaches ~3:1
                 against the dark sidebar, and brightening it enough to fix that
                 clips the blue towards cyan and distorts the brand colours. -->
            <RouterLink
              to="/"
              class="block group rounded-xl transition-all duration-200 dark:bg-white/95 dark:p-3 dark:shadow-sm"
            >
              <img
                src="/logo.png"
                alt="North Peak Massage"
                width="180"
                height="127"
                class="w-[180px] h-auto mx-auto transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </RouterLink>
            <p class="text-[0.7rem] uppercase tracking-[0.22em] text-gray-400 dark:text-gray-500 mt-3 text-center">
              Admin Dashboard
            </p>
          </div>

          <!-- Top section -->
          <nav class="mt-6 flex-1 overflow-y-auto">
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

            <!-- Accounting group -->
            <button
              @click="accountingOpen = !accountingOpen"
              class="w-full flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-sage-50 dark:hover:bg-gray-800 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
            >
              <i class="w-5 text-center fas fa-sterling-sign"></i>
              <span>Accounting</span>
              <i class="ml-auto text-xs fas" :class="accountingOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>
            <div v-show="accountingOpen">
              <RouterLink
                v-for="child in accountingChildren"
                :key="child.name"
                :to="child.to"
                class="flex items-center pl-14 pr-6 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-sage-50 dark:hover:bg-gray-800 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                :class="{ 'bg-sage-50 dark:bg-gray-800 text-sage-600 dark:text-sage-400 border-l-2 border-sage-600': isActive(child.to) }"
              >
                <span>{{ child.name }}</span>
              </RouterLink>
            </div>
          </nav>

          <!-- Bottom section -->
          <div class="border-t border-gray-200 dark:border-gray-800 py-2">
            <!-- Settings group -->
            <button
              @click="settingsOpen = !settingsOpen"
              class="w-full flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-sage-50 dark:hover:bg-gray-800 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
            >
              <i class="w-5 text-center fas fa-gear"></i>
              <span>Settings</span>
              <i class="ml-auto text-xs fas" :class="settingsOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>
            <div v-show="settingsOpen">
              <RouterLink
                v-for="child in settingsChildren"
                :key="child.name"
                :to="child.to"
                class="flex items-center pl-14 pr-6 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-sage-50 dark:hover:bg-gray-800 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
                :class="{ 'bg-sage-50 dark:bg-gray-800 text-sage-600 dark:text-sage-400 border-l-2 border-sage-600': isActive(child.to) }"
              >
                <span>{{ child.name }}</span>
              </RouterLink>
            </div>

            <button
              @click="logout"
              class="w-full flex items-center gap-3 px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-sage-50 dark:hover:bg-gray-800 hover:text-sage-600 dark:hover:text-sage-400 transition-colors"
            >
              <i class="w-5 text-center fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 pt-14 sidebar:pt-0">
          <RouterView />
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLeadsStore } from '@/stores/leads'
import { useBookingsStore } from '@/stores/bookings'

const router = useRouter()
const authStore = useAuthStore()
const leadsStore = useLeadsStore()
const bookingsStore = useBookingsStore()
const settingsOpen = ref(false)
const accountingOpen = ref(false)
// Sidebar drawer state below the `sidebar` breakpoint (920px) — irrelevant
// above it, where the sidebar is always visible regardless of this value.
const sidebarOpen = ref(false)

const pendingBookingsCount = computed(
  () => bookingsStore.bookings.filter((b) => b.status === 'PENDING').length
)

const navigation = computed(() => [
  { name: 'Dashboard', to: '/', icon: 'fas fa-chart-line' },
  { name: 'Leads', to: '/leads', icon: 'fas fa-inbox', badge: leadsStore.unreadCount },
  { name: 'Clients', to: '/clients', icon: 'fas fa-users' },
  { name: 'Bookings', to: '/bookings', icon: 'fas fa-calendar', badge: pendingBookingsCount.value },
  { name: 'Emails', to: '/emails', icon: 'fas fa-envelope' },
])

const accountingChildren = [
  { name: 'Dashboard', to: '/accounting/dashboard' },
  { name: 'Expenses', to: '/accounting/expenses' },
  { name: 'Receipts', to: '/accounting/receipts' },
]

const settingsChildren = [
  { name: 'Appearance', to: '/settings/appearance' },
  { name: 'General', to: '/settings/general' },
  { name: 'Availability', to: '/settings/availability' },
  { name: 'Services', to: '/settings/services' },
  { name: 'Email', to: '/settings/email' },
  { name: 'Email Templates', to: '/settings/email-templates' },
]

function isActive(path: string) {
  return router.currentRoute.value.path === path
}

// Keep a group expanded whenever one of its sub-pages is open, and close the
// mobile drawer on every navigation (a no-op above the `sidebar` breakpoint).
watch(
  () => router.currentRoute.value.path,
  (path) => {
    if (path.startsWith('/settings')) settingsOpen.value = true
    if (path.startsWith('/accounting')) accountingOpen.value = true
    sidebarOpen.value = false
  },
  { immediate: true }
)

async function logout() {
  // Await the server round-trip so the session row is actually revoked, not just
  // forgotten locally.
  await authStore.logout()
  router.push('/login')
}

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
