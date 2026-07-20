<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">New Receipt</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-4">
        <!-- File -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Photo or PDF</label>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
            capture="environment"
            class="input-field"
            required
            @change="onFileChange"
          />
          <p v-if="selectedFile" class="text-xs text-gray-500 mt-1">{{ selectedFile.name }} ({{ formatSize(selectedFile.size) }})</p>
        </div>

        <!-- Vendor -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Vendor <span class="text-gray-400 font-normal">(optional)</span></label>
          <input v-model="form.vendor" type="text" class="input-field" placeholder="e.g. Screwfix" />
        </div>

        <!-- Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date <span class="text-gray-400 font-normal">(optional)</span></label>
          <input v-model="form.date" type="date" class="input-field" />
        </div>

        <!-- Total amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Total on receipt (£) <span class="text-gray-400 font-normal">(optional)</span></label>
          <input v-model="form.totalPounds" type="number" min="0" step="0.01" class="input-field" placeholder="e.g. 30.00" />
          <p class="text-xs text-gray-500 mt-1">Leave blank if it's a mixed receipt without one clean claimable total — you can still log expenses against it.</p>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea v-model="form.notes" rows="2" class="input-field"></textarea>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading">Uploading...</span>
            <template v-else><i class="fas fa-upload"></i><span>Upload</span></template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useReceiptsStore } from '@/stores/receipts'

const emit = defineEmits<{ close: []; saved: [] }>()

const store = useReceiptsStore()
const loading = ref(false)
const error = ref('')
const selectedFile = ref<File | null>(null)

const form = reactive({
  vendor: '',
  date: new Date().toISOString().slice(0, 10),
  totalPounds: '',
  notes: '',
})

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`
}

async function submitForm() {
  if (!selectedFile.value) {
    error.value = 'Choose a photo or PDF of the receipt'
    return
  }

  loading.value = true
  error.value = ''
  try {
    await store.createReceipt({
      file: selectedFile.value,
      vendor: form.vendor.trim() || null,
      date: form.date ? new Date(form.date).toISOString() : null,
      totalAmount: form.totalPounds ? Math.round(Number(form.totalPounds) * 100) : null,
      notes: form.notes.trim() || null,
    })
    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value = err?.message || 'Failed to upload receipt'
  } finally {
    loading.value = false
  }
}
</script>
