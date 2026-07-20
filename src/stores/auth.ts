import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'

export interface AdminUser {
  email: string
  name?: string | null
  picture?: string | null
}

// The session itself lives in an httpOnly cookie the browser sends automatically
// and JavaScript cannot read. This store only caches who the server says we are,
// so it is never a credential in its own right.
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AdminUser | null>(null)
  // Whether we've asked the server yet. The router waits on this before deciding
  // to bounce someone to /login, otherwise a refresh would always redirect.
  const resolved = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  async function resolveSession(): Promise<void> {
    try {
      user.value = await apiService.getCurrentUser()
    } catch {
      user.value = null
    } finally {
      resolved.value = true
    }
  }

  // Resolve once per page load; later calls reuse the cached answer.
  let inflight: Promise<void> | null = null
  function ensureResolved(): Promise<void> {
    if (resolved.value) return Promise.resolve()
    if (!inflight) inflight = resolveSession().finally(() => { inflight = null })
    return inflight
  }

  async function loginWithGoogle(credential: string): Promise<void> {
    user.value = await apiService.loginWithGoogle(credential)
    resolved.value = true
  }

  async function logout(): Promise<void> {
    try {
      await apiService.logout()
    } finally {
      user.value = null
      resolved.value = true
    }
  }

  // Called by the API layer when the server rejects us mid-session.
  function clearSession() {
    user.value = null
    resolved.value = true
  }

  return {
    user,
    resolved,
    isAuthenticated,
    resolveSession,
    ensureResolved,
    loginWithGoogle,
    logout,
    clearSession,
  }
})
