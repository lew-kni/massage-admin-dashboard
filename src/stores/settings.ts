import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiService } from '@/services/api'
import type { AppSettings } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings | null>(null)
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // DANGER ZONE delete toggles — default false so a failed/absent fetch never
  // exposes a delete button that should be hidden.
  const allowDeleteClients = computed(() => settings.value?.allowDeleteClients ?? false)
  const allowDeleteBookings = computed(() => settings.value?.allowDeleteBookings ?? false)

  // Fetch once and cache; pass force to refetch (e.g. after saving elsewhere).
  async function fetchSettings(force = false) {
    if (loaded.value && !force) return settings.value
    loading.value = true
    error.value = null
    try {
      settings.value = await apiService.getSettings()
      loaded.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load settings'
    } finally {
      loading.value = false
    }
    return settings.value
  }

  async function updateSettings(partial: Partial<AppSettings>) {
    settings.value = await apiService.updateSettings(partial)
    loaded.value = true
    return settings.value
  }

  return {
    settings,
    loaded,
    loading,
    error,
    allowDeleteClients,
    allowDeleteBookings,
    fetchSettings,
    updateSettings,
  }
})
