<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
      <h2 class="text-lg font-semibold mb-4">Mark as Paid</h2>
      
      <p class="text-gray-600 text-sm mb-6">Select payment method:</p>
      
      <div class="space-y-3 mb-6">
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50" :class="{ 'border-sage-500 bg-sage-50': selectedMethod === 'CASH' }">
          <input type="radio" v-model="selectedMethod" value="CASH" class="w-4 h-4" />
          <div>
            <p class="font-medium text-gray-900">Cash</p>
            <p class="text-xs text-gray-500">Payment received in cash</p>
          </div>
        </label>
        
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50" :class="{ 'border-sage-500 bg-sage-50': selectedMethod === 'BACS' }">
          <input type="radio" v-model="selectedMethod" value="BACS" class="w-4 h-4" />
          <div>
            <p class="font-medium text-gray-900">BACS</p>
            <p class="text-xs text-gray-500">Bank transfer received</p>
          </div>
        </label>
      </div>

      <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded">
        <p class="text-sm text-red-700">{{ error }}</p>
      </div>

      <div class="flex gap-3">
        <button @click="$emit('close')" class="btn-secondary flex-1">
          Cancel
        </button>
        <button @click="confirm" :disabled="!selectedMethod || saving" class="btn-primary flex-1" :class="{ 'opacity-50 cursor-not-allowed': !selectedMethod || saving }">
          {{ saving ? 'Saving...' : 'Confirm' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  saving?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [method: 'CASH' | 'BACS']
}>()

const selectedMethod = ref<'CASH' | 'BACS' | ''>('')
const error = ref('')

function confirm() {
  if (!selectedMethod.value) return
  emit('confirm', selectedMethod.value as 'CASH' | 'BACS')
}
</script>
