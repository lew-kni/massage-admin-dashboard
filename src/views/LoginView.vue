<template>
  <div class="min-h-screen bg-gradient-to-br from-sage-50 to-sky-50 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold text-sage-600">Fettleworks</h1>
          <p class="text-gray-500 mt-2">Admin Dashboard</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              id="apiKey"
              v-model="apiKey"
              type="password"
              class="input-field"
              placeholder="Enter your API key"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="loading || !apiKey"
            class="btn-primary w-full"
          >
            <span v-if="loading">Authenticating...</span>
            <span v-else>Login</span>
          </button>
        </form>

        <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs text-blue-700">
            <strong>Demo:</strong> Use the API key from your backend configuration.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiService } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const apiKey = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!apiKey.value) return

  loading.value = true
  error.value = ''

  try {
    // Test the API key by making a simple request
    authStore.login(apiKey.value)

    // Try to fetch clients to verify the key works
    await apiService.getClients()

    router.push('/')
  } catch (err) {
    error.value = 'Invalid API key or connection error. Please check your credentials.'
    authStore.logout()
  } finally {
    loading.value = false
  }
}
</script>
