<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-sm w-full">
      <h2 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-50">Record payment</h2>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (£)</label>
          <input v-model.number="form.amount" type="number" step="1" class="input-field" />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Use a negative amount for a refund.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Method</label>
          <select v-model="form.method" class="input-field">
            <option value="CASH">Cash</option>
            <option value="BACS">BACS</option>
            <option value="CARD">Card</option>
            <option value="VOUCHER">Voucher</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div v-if="form.method === 'CARD'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Card fee (£, optional)</label>
          <input v-model.number="form.feeAmount" type="number" step="1" min="0" class="input-field" placeholder="e.g. 1" />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Terminal processing fee — recorded for reconciliation; doesn't reduce the amount paid.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date received</label>
          <input v-model="form.date" type="date" class="input-field" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (optional)</label>
          <input v-model="form.note" type="text" maxlength="500" class="input-field" placeholder="e.g. deposit" />
        </div>
      </div>

      <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded">
        <p class="text-sm text-red-700 dark:text-red-400">{{ error }}</p>
      </div>

      <div class="flex gap-3 mt-6">
        <button @click="$emit('close')" class="btn-secondary flex-1">Cancel</button>
        <button
          @click="confirm"
          :disabled="saving || !form.amount"
          class="btn-primary flex-1"
          :class="{ 'opacity-50 cursor-not-allowed': saving || !form.amount }"
        >
          {{ saving ? 'Saving...' : 'Record' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { toLondonInputParts, londonWallTimeToUtc } from '@/utils/formatLondon'
import type { PaymentMethod } from '@/types'

const props = defineProps<{
  saving?: boolean
  // Suggested default amount — the outstanding balance.
  suggestedAmount?: number
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: { amount: number; method: PaymentMethod; receivedAt: string; feeAmount: number | null; note: string | null }]
}>()

const error = ref('')

const form = reactive({
  amount: props.suggestedAmount && props.suggestedAmount > 0 ? props.suggestedAmount : (undefined as number | undefined),
  method: 'CASH' as PaymentMethod,
  feeAmount: undefined as number | undefined,
  date: toLondonInputParts(new Date()).date,
  note: '',
})

function confirm() {
  error.value = ''
  if (!form.amount || form.amount === 0) {
    error.value = 'Enter a non-zero amount.'
    return
  }
  if (!form.date) {
    error.value = 'Pick a date.'
    return
  }
  // Money received on a calendar day -- pin to London noon so no timezone edge
  // can shift the date, then convert to the UTC instant the backend stores.
  const receivedAt = londonWallTimeToUtc(form.date, '12:00').toISOString()
  emit('confirm', {
    amount: Math.round(form.amount),
    method: form.method,
    receivedAt,
    feeAmount: form.method === 'CARD' && form.feeAmount ? Math.round(form.feeAmount) : null,
    note: form.note.trim() || null,
  })
}
</script>
