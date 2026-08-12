<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
      <h2 class="text-lg font-semibold mb-1">Cancel booking</h2>
      <p class="text-gray-600 text-sm mb-4">
        The client will be emailed a cancellation notice{{ fee > 0 ? `, stating the £${fee} fee` : '' }}.
      </p>

      <!-- Notice given + policy tier -->
      <div class="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
        <p class="text-gray-700">
          Notice given: <strong>{{ noticeText }}</strong>
        </p>
        <p class="text-gray-500 mt-1">
          Policy — {{ suggestion.tierLabel }}:
          <strong>{{ suggestion.percent }}%</strong>
          <template v-if="suggestion.amount !== null"> (£{{ suggestion.amount }})</template>
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
          step="1"
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
          {{ saving ? 'Cancelling…' : (fee > 0 ? `Cancel & charge £${fee}` : 'Cancel booking') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Booking } from '@/types'
import { suggestedCancellationFee, formatNotice } from '@/utils/cancellationPolicy'

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
// edit it or waive entirely.
const fee = ref<number>(suggestion.amount ?? 0)
const waived = ref(false)

const noticeText = computed(() => formatNotice(suggestion.hoursNotice))

function confirm() {
  const amount = waived.value ? 0 : Math.max(0, Math.round(Number(fee.value) || 0))
  emit('confirm', amount)
}
</script>
