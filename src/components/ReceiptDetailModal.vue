<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div class="card-header flex justify-between items-center">
        <h2 class="text-lg font-semibold">{{ detail?.vendor || 'Receipt' }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700"><i class="fas fa-xmark"></i></button>
      </div>

      <div v-if="!detail" class="card-body text-center text-gray-500 py-8">Loading…</div>

      <div v-else class="card-body space-y-5">
        <!-- File + basic details -->
        <div class="flex items-start justify-between">
          <div class="text-sm text-gray-600 space-y-1">
            <p v-if="detail.date"><i class="fas fa-calendar w-4 text-gray-400 mr-1"></i>{{ formatDate(detail.date) }}</p>
            <p v-if="detail.totalAmount != null"><i class="fas fa-tag w-4 text-gray-400 mr-1"></i>Receipt total: {{ gbp(detail.totalAmount / 100) }}</p>
            <p v-if="detail.notes" class="text-gray-500">{{ detail.notes }}</p>
          </div>
          <button @click="viewFile" class="btn-secondary text-sm whitespace-nowrap">
            <i class="fas fa-file-arrow-up mr-1"></i>View file
          </button>
        </div>

        <!-- Running total -->
        <div v-if="detail.totalAmount != null" class="bg-gray-50 rounded p-3">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">{{ gbp(detail.loggedTotal / 100) }} of {{ gbp(detail.totalAmount / 100) }} logged</span>
            <span class="text-gray-500">{{ remainingLabel }}</span>
          </div>
          <div class="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              class="h-full rounded-full"
              :class="detail.loggedTotal > detail.totalAmount ? 'bg-amber-500' : 'bg-sage-500'"
              :style="{ width: `${Math.min(100, pct(detail.loggedTotal, detail.totalAmount))}%` }"
            ></div>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">{{ gbp(detail.loggedTotal / 100) }} logged so far.</p>

        <!-- Linked expenses -->
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Expenses on this receipt</h3>
          <ul v-if="detail.expenses.length" class="space-y-2">
            <li v-for="e in detail.expenses" :key="e.id" class="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
              <span>
                {{ e.description }}
                <span class="text-gray-400">— {{ categoryLabel(e.category) }}</span>
              </span>
              <span class="flex items-center gap-3">
                <span class="font-medium">{{ gbp(e.amount / 100) }}</span>
                <button @click="unlinkExpense(e.id)" class="text-gray-400 hover:text-red-600"><i class="fas fa-xmark"></i></button>
              </span>
            </li>
          </ul>
          <p v-else class="text-sm text-gray-500">Nothing logged against this receipt yet.</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-3 border-t">
          <button @click="showExpenseForm = true" class="btn-primary text-sm">
            <i class="fas fa-plus mr-1"></i>Add expense
          </button>
          <button v-if="!showExpensePicker" @click="openExpensePicker" class="btn-secondary text-sm">
            <i class="fas fa-paperclip mr-1"></i>Attach existing
          </button>
        </div>
        <div v-if="showExpensePicker" class="space-y-2">
          <input v-model="expenseSearch" type="text" class="input-field text-sm" placeholder="Search expenses by description..." />
          <ul class="max-h-32 overflow-y-auto border rounded divide-y">
            <li
              v-for="e in attachableExpenses"
              :key="e.id"
              class="px-3 py-2 text-sm hover:bg-sage-50 cursor-pointer flex justify-between"
              @click="attachExpense(e.id)"
            >
              <span>{{ e.description }} <span class="text-gray-400">{{ formatDate(e.date) }}</span></span>
              <span class="text-gray-500">{{ gbp(e.amount / 100) }}</span>
            </li>
            <li v-if="attachableExpenses.length === 0" class="px-3 py-2 text-sm text-gray-400">No matching expenses.</li>
          </ul>
        </div>

        <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <ExpenseFormModal
      v-if="showExpenseForm"
      :receipt-id="receiptId"
      :initial-vendor="detail?.vendor"
      :initial-date="detail?.date"
      @close="showExpenseForm = false"
      @saved="onExpenseSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { useReceiptsStore } from '@/stores/receipts'
import { useExpensesStore } from '@/stores/expenses'
import { categoryLabel } from '@/constants/expenseCategories'
import type { ReceiptDetail } from '@/types'
import ExpenseFormModal from './ExpenseFormModal.vue'

const props = defineProps<{ receiptId: string }>()
const emit = defineEmits<{ close: []; changed: [] }>()

const receiptsStore = useReceiptsStore()
const expensesStore = useExpensesStore()

const detail = ref<ReceiptDetail | null>(null)
const error = ref('')
const showExpenseForm = ref(false)
const showExpensePicker = ref(false)
const expenseSearch = ref('')

const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)
function formatDate(date?: string | null): string {
  return date ? format(new Date(date), 'dd MMM yyyy') : ''
}

const remainingLabel = computed(() => {
  if (!detail.value?.totalAmount) return ''
  const remaining = detail.value.totalAmount - detail.value.loggedTotal
  if (remaining === 0) return 'fully logged'
  return remaining > 0 ? `${gbp(remaining / 100)} left to log` : `${gbp(Math.abs(remaining) / 100)} over`
})

async function loadDetail() {
  detail.value = await receiptsStore.getReceipt(props.receiptId)
}

async function viewFile() {
  const url = await receiptsStore.getFileUrl(props.receiptId)
  window.open(url, '_blank')
}

async function onExpenseSaved() {
  showExpenseForm.value = false
  await loadDetail()
  emit('changed')
}

async function unlinkExpense(expenseId: string) {
  try {
    await receiptsStore.unlinkExpense(props.receiptId, expenseId)
    await loadDetail()
    emit('changed')
  } catch (err: any) {
    error.value = err?.message || 'Failed to remove that expense'
  }
}

function openExpensePicker() {
  showExpensePicker.value = true
  if (expensesStore.expenses.length === 0) expensesStore.fetchExpenses()
}

const attachableExpenses = computed(() => {
  const linkedIds = new Set(detail.value?.expenses.map((e) => e.id) || [])
  const search = expenseSearch.value.trim().toLowerCase()
  return expensesStore.expenses
    .filter((e) => !linkedIds.has(e.id))
    .filter((e) => !search || e.description.toLowerCase().includes(search))
    .slice(0, 20)
})

async function attachExpense(expenseId: string) {
  try {
    await receiptsStore.linkExpense(props.receiptId, expenseId)
    await loadDetail()
    expenseSearch.value = ''
    emit('changed')
  } catch (err: any) {
    error.value = err?.message || 'Failed to attach that expense'
  }
}

onMounted(loadDetail)
</script>
