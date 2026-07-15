import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const apiKey = ref<string | null>(localStorage.getItem('apiKey'))

  const isAuthenticated = computed(() => apiKey.value !== null)

  function login(key: string) {
    apiKey.value = key
    localStorage.setItem('apiKey', key)
  }

  function logout() {
    apiKey.value = null
    localStorage.removeItem('apiKey')
  }

  return {
    apiKey,
    isAuthenticated,
    login,
    logout,
  }
}, {
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth',
        storage: localStorage,
      }
    ]
  }
})
