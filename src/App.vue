<template>
  <div class="min-h-screen bg-gray-50">
    <template v-if="!authStore.isAuthenticated">
      <RouterView />
    </template>
    <template v-else>
      <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        <aside class="w-64 bg-white border-r border-gray-200 flex flex-col relative">
          <div class="p-6">
            <h1 class="text-2xl font-bold text-sage-600">Fettleworks</h1>
            <p class="text-sm text-gray-500 mt-1">Admin Dashboard</p>
          </div>

          <nav class="mt-6 flex-1">
            <RouterLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.to"
              class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-sage-50 hover:text-sage-600 transition-colors"
              :class="{ 'bg-sage-50 text-sage-600 border-l-2 border-sage-600': isActive(item.to) }"
            >
              <span class="text-xl">{{ item.icon }}</span>
              <span>{{ item.name }}</span>
            </RouterLink>
          </nav>

          <div class="p-6 border-t border-gray-200">
            <button
              @click="logout"
              class="w-full btn-secondary"
            >
              Logout
            </button>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-auto">
          <RouterView />
        </main>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const navigation = [
  { name: 'Dashboard', to: '/', icon: '📊' },
  { name: 'Clients', to: '/clients', icon: '👥' },
  { name: 'Bookings', to: '/bookings', icon: '📅' },
  { name: 'Services', to: '/services', icon: '💆' },
  { name: 'Availability', to: '/availability', icon: '🕐' },
  { name: 'Emails', to: '/emails', icon: '✉️' },
]

function isActive(path: string) {
  return router.currentRoute.value.path === path
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>
