<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-md w-full">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ expense ? 'Edit Expense' : 'New Expense' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <form @submit.prevent="submitForm" class="card-body space-y-4">
        <!-- Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input v-model="form.date" type="date" class="input-field" required />
        </div>

        <!-- Category (moved above amount/miles since it decides which field shows) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select v-model="form.category" class="input-field" required>
            <option v-for="c in EXPENSE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">{{ selectedHint }}</p>
        </div>

        <!-- Miles (mileage flow) -->
        <div v-if="isMileage">
          <label class="block text-sm font-medium text-gray-700 mb-1">Miles driven</label>
          <input v-model="form.miles" type="number" min="1" step="1" class="input-field" required placeholder="e.g. 24" />
          <p class="text-xs text-gray-500 mt-1">
            <template v-if="milesEntered > 0">
              Estimated claim: <span class="font-medium text-gray-700">{{ gbp(estimatedAmountPence / 100) }}</span>
              ({{ milesAtStandardRate }} mi @ 45p<template v-if="milesAtReducedRate > 0">, {{ milesAtReducedRate }} mi @ 25p</template>)
            </template>
            <template v-else>Based on {{ milesAlreadyLoggedThisYear }} mile{{ milesAlreadyLoggedThisYear === 1 ? '' : 's' }} already logged this tax year.</template>
          </p>
        </div>

        <!-- Amount (everything else) -->
        <div v-else>
          <label class="block text-sm font-medium text-gray-700 mb-1">Amount (£)</label>
          <input v-model="form.amountPounds" type="number" min="0.01" step="0.01" class="input-field" required placeholder="e.g. 12.99" />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">What was it for?</label>
          <input v-model="form.description" type="text" class="input-field" required :placeholder="isMileage ? 'e.g. Visit to client in New Mills' : 'e.g. Tank of petrol'" />
        </div>

        <!-- Vendor -->
        <div v-if="!isMileage">
          <label class="block text-sm font-medium text-gray-700 mb-1">Who did you pay? <span class="text-gray-400 font-normal">(optional)</span></label>
          <input v-model="form.vendor" type="text" class="input-field" placeholder="e.g. Tesco, Amazon" />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea v-model="form.notes" rows="2" class="input-field" placeholder="Anything worth remembering about this one"></textarea>
        </div>

        <!-- Receipts (edit mode only — attach/detach the same way as from the Receipt view) -->
        <div v-if="expense" class="pt-2 border-t">
          <label class="block text-sm font-medium text-gray-700 mb-2">Receipts</label>
          <ul v-if="linkedReceipts.length" class="space-y-2 mb-2">
            <li v-for="r in linkedReceipts" :key="r.id" class="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
              <span>
                <i class="fas fa-receipt text-gray-400 mr-1"></i>
                {{ r.vendor || 'Receipt' }}
                <span v-if="r.totalAmount != null" class="text-gray-500">— {{ gbp(r.totalAmount / 100) }}</span>
              </span>
              <button type="button" @click="unlinkReceipt(r.id)" class="text-gray-400 hover:text-red-600"><i class="fas fa-xmark"></i></button>
            </li>
          </ul>
          <p v-else class="text-xs text-gray-500 mb-2">No receipts attached yet.</p>

          <button v-if="!showReceiptPicker" type="button" @click="openReceiptPicker" class="text-sm text-sage-600 hover:text-sage-700">
            <i class="fas fa-paperclip mr-1"></i>Attach existing receipt
          </button>
          <div v-else class="space-y-2">
            <input v-model="receiptSearch" type="text" class="input-field text-sm" placeholder="Search receipts by vendor..." />
            <ul class="max-h-32 overflow-y-auto border rounded divide-y">
              <li v-for="r in attachableReceipts" :key="r.id" class="px-3 py-2 text-sm hover:bg-sage-50 cursor-pointer flex justify-between" @click="attachReceipt(r.id)">
                <span>{{ r.vendor || 'Receipt' }} <span class="text-gray-400">{{ formatDate(r.date) }}</span></span>
                <span v-if="r.totalAmount != null" class="text-gray-500">{{ gbp(r.totalAmount / 100) }}</span>
              </li>
              <li v-if="attachableReceipts.length === 0" class="px-3 py-2 text-sm text-gray-400">No matching receipts.</li>
            </ul>
          </div>
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <div class="flex gap-3 justify-end pt-4 border-t">
          <button type="button" @click="$emit('close')" class="btn-secondary">Cancel</button>
          <button type="submit" :disabled="loading" class="btn-primary">
            <span v-if="loading">Saving...</span>
            <template v-else-if="expense"><i class="fas fa-check"></i><span>Save</span></template>
            <template v-else><i class="fas fa-plus"></i><span>Add expense</span></template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { useExpensesStore } from '@/stores/expenses'
import { useReceiptsStore } from '@/stores/receipts'
import { apiService } from '@/services/api'
import { EXPENSE_CATEGORIES } from '@/constants/expenseCategories'
import { calculateMileageAmountPence, taxYearStart, taxYearEnd } from '@/utils/mileage'
import type { Expense, ExpenseCategory, ReceiptSummary } from '@/types'

const props = defineProps<{
  expense?: Expense
  // Set when creating a new expense from within a Receipt's "add expense" flow.
  receiptId?: string
  initialVendor?: string | null
  initialDate?: string | null
}>()
const emit = defineEmits<{ close: []; saved: [] }>()

const store = useExpensesStore()
const receiptsStore = useReceiptsStore()
const loading = ref(false)
const error = ref('')

const form = reactive({
  date: props.expense?.date?.slice(0, 10) || props.initialDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  amountPounds: props.expense && props.expense.category !== 'MILEAGE' ? (props.expense.amount / 100).toFixed(2) : '',
  category: (props.expense?.category || 'SUPPLIES') as ExpenseCategory,
  miles: props.expense?.miles ? String(props.expense.miles) : '',
  description: props.expense?.description || '',
  vendor: props.expense?.vendor || props.initialVendor || '',
  notes: props.expense?.notes || '',
})

// --- attached receipts (edit mode only) -------------------------------------
const linkedReceipts = ref<ReceiptSummary[]>([])
const showReceiptPicker = ref(false)
const receiptSearch = ref('')

async function refreshLinkedReceipts() {
  if (!props.expense) return
  const full = await apiService.getExpense(props.expense.id)
  linkedReceipts.value = full.receipts || []
}

function openReceiptPicker() {
  showReceiptPicker.value = true
  if (receiptsStore.receipts.length === 0) receiptsStore.fetchReceipts()
}

const attachableReceipts = computed(() => {
  const linkedIds = new Set(linkedReceipts.value.map((r) => r.id))
  const search = receiptSearch.value.trim().toLowerCase()
  return receiptsStore.receipts
    .filter((r) => !linkedIds.has(r.id))
    .filter((r) => !search || (r.vendor || '').toLowerCase().includes(search))
    .slice(0, 20)
})

async function attachReceipt(receiptId: string) {
  if (!props.expense) return
  await receiptsStore.linkExpense(receiptId, props.expense.id)
  await refreshLinkedReceipts()
  receiptSearch.value = ''
}

async function unlinkReceipt(receiptId: string) {
  if (!props.expense) return
  await receiptsStore.unlinkExpense(receiptId, props.expense.id)
  await refreshLinkedReceipts()
}

function formatDate(date?: string | null): string {
  return date ? format(new Date(date), 'dd MMM yyyy') : ''
}

onMounted(refreshLinkedReceipts)

const isMileage = computed(() => form.category === 'MILEAGE')
const milesEntered = computed(() => Number(form.miles) || 0)

const selectedHint = computed(
  () => EXPENSE_CATEGORIES.find((c) => c.value === form.category)?.hint || ''
)

const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Live estimate only — the server recalculates authoritatively on save, since
// other mileage entries can be added out of order.
const milesAlreadyLoggedThisYear = computed(() => {
  const start = taxYearStart(form.date)
  const end = taxYearEnd(form.date)
  return store.expenses
    .filter((e) => e.category === 'MILEAGE' && e.id !== props.expense?.id)
    .filter((e) => {
      const t = new Date(e.date).getTime()
      return t >= start.getTime() && t < end.getTime()
    })
    .reduce((sum, e) => sum + (e.miles || 0), 0)
})
const milesAtStandardRate = computed(() =>
  Math.min(milesEntered.value, Math.max(0, 10000 - milesAlreadyLoggedThisYear.value))
)
const milesAtReducedRate = computed(() => milesEntered.value - milesAtStandardRate.value)
const estimatedAmountPence = computed(() =>
  calculateMileageAmountPence(milesAlreadyLoggedThisYear.value, milesEntered.value)
)

async function submitForm() {
  if (!form.description.trim()) {
    error.value = 'Say what the expense was for'
    return
  }

  let payload: Record<string, unknown>
  if (isMileage.value) {
    const miles = Number(form.miles)
    if (!miles || miles <= 0) {
      error.value = 'Enter the number of miles driven'
      return
    }
    payload = {
      date: new Date(form.date).toISOString(),
      category: form.category,
      miles,
      description: form.description.trim(),
      notes: form.notes.trim() || null,
    }
  } else {
    const pounds = Number(form.amountPounds)
    if (!pounds || pounds <= 0) {
      error.value = 'Enter an amount greater than £0'
      return
    }
    payload = {
      date: new Date(form.date).toISOString(),
      amount: Math.round(pounds * 100),
      category: form.category,
      description: form.description.trim(),
      vendor: form.vendor.trim() || null,
      notes: form.notes.trim() || null,
    }
  }

  loading.value = true
  error.value = ''
  try {
    if (props.expense) {
      await store.updateExpense(props.expense.id, payload)
    } else if (props.receiptId) {
      await receiptsStore.createExpenseUnderReceipt(
        props.receiptId,
        payload as Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
      )
    } else {
      await store.createExpense(payload as Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>)
    }
    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value = err?.message || 'Failed to save expense'
  } finally {
    loading.value = false
  }
}
</script>
