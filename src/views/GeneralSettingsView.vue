<template>
  <div class="p-8 dark:text-gray-50">
    <div class="mb-8">
      <h1 class="dark:text-gray-50">General</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Admin controls</p>
    </div>

    <!-- Payment / bank details -->
    <div class="card max-w-3xl mb-6">
      <div class="card-header flex items-center justify-between">
        <h2 class="text-lg font-semibold"><i class="fas fa-building-columns mr-2"></i>Bank details (client payments)</h2>
        <span v-if="bankMessage" class="text-sm text-green-600"><i class="fas fa-check mr-1"></i>{{ bankMessage }}</span>
        <span v-else-if="bankError" class="text-sm text-red-600"><i class="fas fa-circle-exclamation mr-1"></i>{{ bankError }}</span>
      </div>
      <div class="card-body">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Shown in the "How to pay" section of the booking confirmation email so clients can pay by bank transfer
          (with their booking reference). Leave blank to omit that section. All three are needed for it to appear.
        </p>
        <div v-if="loading" class="text-sm text-gray-500">Loading…</div>
        <form v-else class="space-y-4" @submit.prevent="saveBank">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account name</label>
            <input v-model="bank.bankAccountName" type="text" maxlength="200" class="input-field" placeholder="e.g. North Peak Massage" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort code</label>
              <input v-model="bank.bankSortCode" type="text" maxlength="20" class="input-field" placeholder="00-00-00" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account number</label>
              <input v-model="bank.bankAccountNumber" type="text" maxlength="40" class="input-field" placeholder="12345678" />
            </div>
          </div>
          <div class="flex justify-end">
            <button type="submit" :disabled="savingBank" class="btn-primary text-sm">
              {{ savingBank ? 'Saving…' : 'Save bank details' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reviews & feedback -->
    <div class="card max-w-3xl mb-6">
      <div class="card-header flex items-center justify-between">
        <h2 class="text-lg font-semibold"><i class="fas fa-star mr-2"></i>Reviews &amp; feedback</h2>
        <span v-if="reviewMessage" class="text-sm text-green-600"><i class="fas fa-check mr-1"></i>{{ reviewMessage }}</span>
        <span v-else-if="reviewError" class="text-sm text-red-600"><i class="fas fa-circle-exclamation mr-1"></i>{{ reviewError }}</span>
      </div>
      <div class="card-body">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Your Google Business review link. When set, the day-after follow-up email invites the client to leave a Google review
          (no incentive attached, per Google's rules). Leave blank to omit the review ask from that email.
        </p>
        <div v-if="loading" class="text-sm text-gray-500">Loading…</div>
        <form v-else class="space-y-4" @submit.prevent="saveReview">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google review URL</label>
            <input v-model="googleReviewUrl" type="url" maxlength="500" class="input-field" placeholder="https://g.page/r/…/review" />
          </div>
          <div class="flex justify-end">
            <button type="submit" :disabled="savingReview" class="btn-primary text-sm">
              {{ savingReview ? 'Saving…' : 'Save review link' }}
            </button>
          </div>
        </form>
      </div>
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
import { ref, reactive, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const { loading, allowDeleteClients, allowDeleteBookings } = storeToRefs(settingsStore)

const saving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

// --- bank details ----------------------------------------------------------
const bank = reactive({ bankAccountName: '', bankSortCode: '', bankAccountNumber: '' })
const savingBank = ref(false)
const bankMessage = ref('')
const bankError = ref('')

function syncBankForm() {
  const s = settingsStore.settings
  bank.bankAccountName = s?.bankAccountName ?? ''
  bank.bankSortCode = s?.bankSortCode ?? ''
  bank.bankAccountNumber = s?.bankAccountNumber ?? ''
  googleReviewUrl.value = s?.googleReviewUrl ?? ''
}

async function saveBank() {
  savingBank.value = true
  bankMessage.value = ''
  bankError.value = ''
  try {
    await settingsStore.updateSettings({
      bankAccountName: bank.bankAccountName.trim(),
      bankSortCode: bank.bankSortCode.trim(),
      bankAccountNumber: bank.bankAccountNumber.trim(),
    })
    bankMessage.value = 'Saved'
    setTimeout(() => (bankMessage.value = ''), 2000)
  } catch (err) {
    bankError.value = err instanceof Error ? err.message : 'Failed to save'
  } finally {
    savingBank.value = false
  }
}

// --- Google review link ----------------------------------------------------
const googleReviewUrl = ref('')
const savingReview = ref(false)
const reviewMessage = ref('')
const reviewError = ref('')

async function saveReview() {
  savingReview.value = true
  reviewMessage.value = ''
  reviewError.value = ''
  try {
    await settingsStore.updateSettings({ googleReviewUrl: googleReviewUrl.value.trim() })
    reviewMessage.value = 'Saved'
    setTimeout(() => (reviewMessage.value = ''), 2000)
  } catch (err) {
    reviewError.value = err instanceof Error ? err.message : 'Failed to save'
  } finally {
    savingReview.value = false
  }
}

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

onMounted(async () => {
  await settingsStore.fetchSettings()
  syncBankForm()
})
</script>
