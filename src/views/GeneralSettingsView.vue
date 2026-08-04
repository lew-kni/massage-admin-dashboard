<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1 class="dark:text-gray-50">General</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Admin controls</p>
    </div>

    <!-- Danger Zone -->
    <div class="card max-w-3xl border-red-300 dark:border-red-800">
      <div class="card-header flex items-center justify-between">
        <h2 class="text-lg font-semibold text-red-700 dark:text-red-400">
          <i class="fas fa-triangle-exclamation mr-2"></i>Danger Zone
        </h2>
        <span v-if="saveMessage" class="text-sm text-green-600"><i class="fas fa-check mr-1"></i>{{ saveMessage }}</span>
        <span v-else-if="saveError" class="text-sm text-red-600"><i class="fas fa-circle-exclamation mr-1"></i>{{ saveError }}</span>
      </div>
      <div class="card-body">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Deletes are permanent and cannot be undone. Turn a toggle on only when you need to remove
          something — the matching <span class="font-medium">Delete</span> button stays hidden while it's off.
        </p>

        <div v-if="loading" class="text-sm text-gray-500">Loading…</div>

        <div v-else class="space-y-1">
          <div class="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
            <div class="pr-4">
              <div class="text-sm font-medium">Allow deleting clients</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Shows a “Delete Client” button on client pages. Permanently removes the client and all their bookings, intake and assessment data.
              </div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="allowDeleteClients"
              :disabled="saving"
              @click="onToggle('allowDeleteClients', !allowDeleteClients)"
              :class="allowDeleteClients ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'"
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <span
                :class="allowDeleteClients ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              ></span>
            </button>
          </div>

          <div class="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
            <div class="pr-4">
              <div class="text-sm font-medium">Allow deleting bookings</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Shows a “Delete Booking” button on booking pages. Permanently removes the booking (use Cancel instead if you just want to mark it cancelled).
              </div>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="allowDeleteBookings"
              :disabled="saving"
              @click="onToggle('allowDeleteBookings', !allowDeleteBookings)"
              :class="allowDeleteBookings ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'"
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <span
                :class="allowDeleteBookings ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const { loading, allowDeleteClients, allowDeleteBookings } = storeToRefs(settingsStore)

const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

type ToggleKey = 'allowDeleteClients' | 'allowDeleteBookings'

async function onToggle(key: ToggleKey, value: boolean) {
  saving.value = true
  saveMessage.value = ''
  saveError.value = ''
  try {
    await settingsStore.updateSettings({ [key]: value })
    saveMessage.value = 'Saved'
    setTimeout(() => (saveMessage.value = ''), 2000)
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to save'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  settingsStore.fetchSettings()
})
</script>
