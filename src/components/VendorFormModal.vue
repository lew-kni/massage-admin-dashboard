<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ vendor ? 'Edit Vendor' : 'New Vendor' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input v-model="form.name" type="text" class="input-field" required placeholder="e.g. Screwfix" />
        </div>

        <!-- Default category -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Default category <span class="text-gray-400 font-normal">(optional)</span>
          </label>
          <select v-model="form.defaultCategory" class="input-field">
            <option :value="null">— None —</option>
            <option v-for="c in EXPENSE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">Pre-selected when you log an expense against this vendor.</p>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea v-model="form.notes" rows="2" class="input-field" placeholder="Anything worth remembering about this supplier"></textarea>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading">Saving...</span>
            <template v-else-if="vendor"><i class="fas fa-check"></i><span>Save</span></template>
            <template v-else><i class="fas fa-plus"></i><span>Add vendor</span></template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useVendorsStore } from '@/stores/vendors'
import { EXPENSE_CATEGORIES } from '@/constants/expenseCategories'
import type { Vendor, ExpenseCategory } from '@/types'

const props = defineProps<{ vendor?: Vendor }>()
const emit = defineEmits<{ close: []; saved: [Vendor] }>()

const store = useVendorsStore()
const loading = ref(false)
const error = ref('')

const form = reactive({
  name: props.vendor?.name || '',
  defaultCategory: (props.vendor?.defaultCategory ?? null) as ExpenseCategory | null,
  notes: props.vendor?.notes || '',
})

async function submitForm() {
  if (!form.name.trim()) {
    error.value = 'Give the vendor a name'
    return
  }
  loading.value = true
  error.value = ''
  const payload = {
    name: form.name.trim(),
    defaultCategory: form.defaultCategory || null,
    notes: form.notes.trim() || null,
  }
  try {
    const saved = props.vendor
      ? await store.updateVendor(props.vendor.id, payload)
      : await store.createVendor(payload)
    emit('saved', saved)
    emit('close')
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to save vendor'
  } finally {
    loading.value = false
  }
}
</script>
