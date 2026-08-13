<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ headerTitle }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <ExpenseModeTabs v-if="showTabs" active="recurring" @select="onTabSelect" />

      <form @submit.prevent="submitForm" class="card-body space-y-4">
        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">What is it?</label>
          <input v-model="form.description" type="text" class="input-field" required placeholder="e.g. Phone bill" />
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select v-model="form.category" class="input-field" required>
            <option v-for="c in categories" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </div>

        <!-- Vendor -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Who do you pay? <span class="text-gray-400 font-normal">(optional)</span></label>
          <VendorSelect v-model="form.vendorId" placeholder="e.g. EE, Vodafone" />
        </div>

        <!-- Usual amount -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Usual amount (£)</label>
          <input v-model="form.amountPounds" type="number" min="0.01" step="0.01" class="input-field" required placeholder="e.g. 35.00" />
          <p class="text-xs text-gray-500 mt-1">Pre-filled into each month — you can adjust it when the real bill comes in.</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Start month -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Starts</label>
            <input v-model="form.startMonth" type="month" class="input-field" required />
          </div>
          <!-- Day of month -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Day of month</label>
            <input v-model="form.dayOfMonth" type="number" min="1" max="28" class="input-field" required />
          </div>
        </div>
        <p class="text-xs text-gray-500 -mt-2">Backfills every month from the start month to now. Day is capped at 28 so it lands in every month.</p>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea v-model="form.notes" rows="2" class="input-field" placeholder="Anything worth remembering"></textarea>
        </div>

        <!-- Active -->
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="form.active" type="checkbox" class="rounded border-gray-300" />
          Active <span class="text-gray-400">(uncheck to stop it suggesting new months)</span>
        </label>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading">Saving...</span>
            <template v-else-if="recurring"><i class="fas fa-check"></i><span>Save</span></template>
            <template v-else><i class="fas fa-plus"></i><span>Add recurring</span></template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from 'vue'
import { useRecurringStore } from '@/stores/recurring'
import { EXPENSE_CATEGORIES } from '@/constants/expenseCategories'
import type { RecurringExpense, ExpenseCategory } from '@/types'
import VendorSelect from '@/components/VendorSelect.vue'
import ExpenseModeTabs, { type ExpenseMode } from '@/components/ExpenseModeTabs.vue'

const props = defineProps<{
  recurring?: RecurringExpense
  // Show the Single/Recurring tab switcher (create flow from the Expenses page).
  modeTabs?: boolean
}>()
const emit = defineEmits<{ close: []; saved: []; 'switch-mode': [] }>()

const showTabs = computed(() => props.modeTabs && !props.recurring)
const headerTitle = computed(() => (props.recurring ? 'Edit Recurring Expense' : showTabs.value ? 'Add' : 'New Recurring Expense'))

function onTabSelect(mode: ExpenseMode) {
  if (mode === 'single') emit('switch-mode')
}

const store = useRecurringStore()
const loading = ref(false)
const error = ref('')

// Mileage is server-computed from miles, so it can't be a fixed-amount template.
const categories = computed(() => EXPENSE_CATEGORIES.filter((c) => c.value !== 'MILEAGE'))

const now = new Date()
const form = reactive({
  description: props.recurring?.description || '',
  category: (props.recurring?.category || 'PHONE_ADMIN') as ExpenseCategory,
  vendorId: props.recurring?.vendorId || null,
  amountPounds: props.recurring ? (props.recurring.amount / 100).toFixed(2) : '',
  startMonth: props.recurring?.startDate?.slice(0, 7) || now.toISOString().slice(0, 7),
  dayOfMonth: String(props.recurring?.dayOfMonth ?? 1),
  notes: props.recurring?.notes || '',
  active: props.recurring?.active ?? true,
})

async function submitForm() {
  if (!form.description.trim()) {
    error.value = 'Say what the recurring expense is for'
    return
  }
  const pounds = Number(form.amountPounds)
  if (!pounds || pounds <= 0) {
    error.value = 'Enter a usual amount greater than £0'
    return
  }
  const [year, month] = form.startMonth.split('-').map(Number)
  if (!year || !month) {
    error.value = 'Choose a start month'
    return
  }

  const payload = {
    description: form.description.trim(),
    category: form.category,
    amount: Math.round(pounds * 100),
    dayOfMonth: Math.min(28, Math.max(1, Number(form.dayOfMonth) || 1)),
    vendorId: form.vendorId || null,
    notes: form.notes.trim() || null,
    active: form.active,
    // Store as the 1st of the chosen month, UTC — matches the backend's month maths.
    startDate: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
  }

  loading.value = true
  error.value = ''
  try {
    if (props.recurring) {
      await store.updateRecurring(props.recurring.id, payload)
    } else {
      await store.createRecurring(payload)
    }
    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to save recurring expense'
  } finally {
    loading.value = false
  }
}
</script>
