<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-lg font-semibold mb-1">Cancel booking</h2>
      <p class="text-gray-600 text-sm mb-4">
        The client will be emailed a cancellation notice{{ feePence > 0 ? `, stating the ${formatGBP(feePence)} fee` : '' }}.
      </p>

      <!-- Notice given + policy tier -->
      <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
        <p class="text-gray-700">
          Notice given: <strong>{{ noticeText }}</strong>
        </p>
        <p class="text-gray-500 mt-1">
          Policy — {{ suggestion.tierLabel }}:
          <strong>{{ suggestion.percent }}%</strong>
          <template v-if="suggestion.amount !== null"> ({{ formatGBP(suggestion.amount) }})</template>
        </p>
      </div>

      <p v-if="noPrice" class="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
        No price is recorded on this booking, so the fee couldn't be calculated automatically — enter one manually if it applies.
      </p>

      <!-- Fee amount -->
      <label class="block text-sm font-medium text-gray-700 mb-1">Cancellation fee</label>
      <div class="flex items-center gap-2">
        <span class="text-gray-500">£</span>
        <input
          type="number"
          min="0"
          step="0.01"
          v-model.number="fee"
          :disabled="waived"
          class="input-field flex-1"
          :class="{ 'opacity-50': waived }"
        />
      </div>

      <!-- Waive -->
      <label class="flex items-center gap-2 mt-3 cursor-pointer text-sm text-gray-700">
        <input type="checkbox" v-model="waived" class="w-4 h-4" />
        Waive the fee (no charge — e.g. I cancelled, or the slot was filled)
      </label>

      <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div class="flex gap-3 mt-6">
        <button @click="$emit('close')" class="btn-secondary flex-1" :disabled="saving">
          Keep booking
        </button>
        <button
          @click="confirm"
          :disabled="saving"
          class="btn-danger flex-1"
          :class="{ 'opacity-50 cursor-not-allowed': saving }"
        >
          {{ saving ? 'Cancelling…' : (feePence > 0 ? `Cancel & charge ${formatGBP(feePence)}` : 'Cancel booking') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Booking } from '@/types'
import { suggestedCancellationFee, formatNotice } from '@/utils/cancellationPolicy'
import { formatGBP, penceToPounds, poundsToPence } from '@/utils/money'

const props = defineProps<{
  booking: Booking
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [fee: number]
}>()

const error = ref('')
const suggestion = suggestedCancellationFee(props.booking)
const noPrice = computed(() => suggestion.amount === null)

// Pre-fill with the policy suggestion (0 when unknown/free); the therapist can
// edit it or waive entirely. The input edits pounds; the suggestion is pence.
const fee = ref<number>(penceToPounds(suggestion.amount) ?? 0)
const waived = ref(false)

// The fee actually charged, in pence — 0 when waived.
const feePence = computed(() => (waived.value ? 0 : Math.max(0, poundsToPence(fee.value) ?? 0)))

const noticeText = computed(() => formatNotice(suggestion.hoursNotice))

function confirm() {
  emit('confirm', feePence.value)
}
</script>
