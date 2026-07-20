<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
      <div>
        <h1>Expenses</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Log what you spend on the business — handy for keeping tabs, and a head start on your tax return.</p>
      </div>
      <div class="flex gap-2">
        <button @click="exportCsv" class="btn-secondary text-sm" :disabled="periodExpenses.length === 0">
          <i class="fas fa-file-arrow-down mr-1"></i>Export CSV
        </button>
        <button @click="openCreate" class="btn-primary text-sm">
          <i class="fas fa-plus mr-1"></i>Add expense
        </button>
      </div>
    </div>

    <!-- Period selector -->
    <div class="flex gap-2 flex-wrap mb-6">
      <button
        v-for="opt in periodOptions"
        :key="opt.value"
        @click="period = opt.value"
        :class="['btn-secondary text-sm', period === opt.value && 'ring-2 ring-sage-500']"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="store.loading && store.expenses.length === 0" class="card p-8 text-center text-gray-500">
      Loading…
    </div>

    <template v-else>
      <!-- Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Total, this period</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{{ gbp(periodTotal) }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ periodExpenses.length }} expense{{ periodExpenses.length === 1 ? '' : 's' }}</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">This tax year</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{{ gbp(taxYearTotal) }}</p>
          <p class="text-xs text-gray-500 mt-1">6 Apr {{ taxYearStartYear }} – 5 Apr {{ taxYearStartYear + 1 }}</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">All time</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{{ gbp(allTimeTotal) }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ store.expenses.length }} logged</p>
        </div>
      </div>

      <!-- Breakdown by category -->
      <div class="card mb-8">
        <div class="card-header">
          <h2 class="text-lg font-semibold"><i class="fas fa-chart-pie mr-2"></i>By category, this period</h2>
        </div>
        <div class="card-body">
          <div v-if="byCategory.length === 0" class="text-center text-gray-500 py-4">No expenses in this period.</div>
          <div v-else class="space-y-3">
            <div v-for="row in byCategory" :key="row.value">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-700 dark:text-gray-300">{{ row.label }} <span class="text-gray-400">({{ row.count }})</span></span>
                <span class="font-medium">{{ gbp(row.total) }}</span>
              </div>
              <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div class="h-full rounded-full bg-sage-500" :style="{ width: `${pct(row.total, byCategoryMax)}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expenses table -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold"><i class="fas fa-receipt mr-2"></i>Expenses</h2>
        </div>
        <div class="card-body">
          <div v-if="periodExpenses.length === 0" class="text-center text-gray-500 py-6">
            <p>Nothing logged for this period yet.</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                  <th class="px-3 py-2 font-semibold">Date</th>
                  <th class="px-3 py-2 font-semibold">Category</th>
                  <th class="px-3 py-2 font-semibold">Description</th>
                  <th class="px-3 py-2 font-semibold">Paid to</th>
                  <th class="px-3 py-2 font-semibold text-right">Amount</th>
                  <th class="px-3 py-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in sortedPeriodExpenses" :key="e.id" class="border-b border-gray-100 dark:border-gray-800 text-sm">
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDate(e.date) }}</td>
                  <td class="px-3 py-2"><span class="badge bg-sage-100 text-sage-800">{{ categoryLabel(e.category) }}</span></td>
                  <td class="px-3 py-2">
                    {{ e.description }}
                    <span v-if="e.category === 'MILEAGE' && e.miles" class="text-gray-400 text-xs">({{ e.miles }} mi)</span>
                    <i v-if="e.receiptCount" class="fas fa-paperclip text-gray-400 text-xs ml-1" :title="`${e.receiptCount} receipt${e.receiptCount === 1 ? '' : 's'} attached`"></i>
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-300">{{ e.vendor || '—' }}</td>
                  <td class="px-3 py-2 text-right font-medium">{{ gbp(e.amount / 100) }}</td>
                  <td class="px-3 py-2 text-right whitespace-nowrap">
                    <button @click="openEdit(e)" class="text-gray-400 hover:text-sage-600 mr-3"><i class="fas fa-pen"></i></button>
                    <button @click="confirmDelete(e)" class="text-gray-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="store.error" class="mt-3 text-sm text-red-700">{{ store.error }}</p>
        </div>
      </div>
    </template>

    <ExpenseFormModal
      v-if="showForm"
      :expense="editingExpense ?? undefined"
      @close="showForm = false"
      @saved="showForm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { useExpensesStore } from '@/stores/expenses'
import { EXPENSE_CATEGORIES, categoryLabel } from '@/constants/expenseCategories'
import type { Expense } from '@/types'
import ExpenseFormModal from '@/components/ExpenseFormModal.vue'

const store = useExpensesStore()

type Period = 'month' | 'lastMonth' | 'year' | 'all'
const period = ref<Period>('month')
const periodOptions: { value: Period; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'year', label: 'This year' },
  { value: 'all', label: 'All time' },
]

const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// --- period scoping --------------------------------------------------------
const periodRange = computed(() => {
  const n = new Date()
  switch (period.value) {
    case 'month':
      return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: new Date(n.getFullYear(), n.getMonth() + 1, 1) }
    case 'lastMonth':
      return { start: new Date(n.getFullYear(), n.getMonth() - 1, 1), end: new Date(n.getFullYear(), n.getMonth(), 1) }
    case 'year':
      return { start: new Date(n.getFullYear(), 0, 1), end: new Date(n.getFullYear() + 1, 0, 1) }
    default:
      return { start: new Date(0), end: new Date(8640000000000000) }
  }
})
function inPeriod(e: Expense): boolean {
  const t = new Date(e.date).getTime()
  return t >= periodRange.value.start.getTime() && t < periodRange.value.end.getTime()
}

const periodExpenses = computed(() => store.expenses.filter(inPeriod))
const sortedPeriodExpenses = computed(() =>
  [...periodExpenses.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
)
const periodTotal = computed(() => periodExpenses.value.reduce((s, e) => s + e.amount, 0) / 100)
const allTimeTotal = computed(() => store.expenses.reduce((s, e) => s + e.amount, 0) / 100)

// UK tax year runs 6 Apr – 5 Apr.
const taxYearStartYear = computed(() => {
  const n = new Date()
  const aprilCutoff = new Date(n.getFullYear(), 3, 6)
  return n >= aprilCutoff ? n.getFullYear() : n.getFullYear() - 1
})
const taxYearTotal = computed(() => {
  const start = new Date(taxYearStartYear.value, 3, 6).getTime()
  const end = new Date(taxYearStartYear.value + 1, 3, 6).getTime()
  return store.expenses
    .filter((e) => {
      const t = new Date(e.date).getTime()
      return t >= start && t < end
    })
    .reduce((s, e) => s + e.amount, 0) / 100
})

// --- breakdown by category --------------------------------------------------
const byCategory = computed(() => {
  const map = new Map<string, { total: number; count: number }>()
  periodExpenses.value.forEach((e) => {
    const cur = map.get(e.category) || { total: 0, count: 0 }
    cur.total += e.amount / 100
    cur.count += 1
    map.set(e.category, cur)
  })
  return EXPENSE_CATEGORIES
    .map((c) => ({ value: c.value, label: c.label, ...(map.get(c.value) || { total: 0, count: 0 }) }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.total - a.total)
})
const byCategoryMax = computed(() => Math.max(1, ...byCategory.value.map((r) => r.total)))

// --- create / edit / delete -------------------------------------------------
const showForm = ref(false)
const editingExpense = ref<Expense | null>(null)

function openCreate() {
  editingExpense.value = null
  showForm.value = true
}
function openEdit(e: Expense) {
  editingExpense.value = e
  showForm.value = true
}
async function confirmDelete(e: Expense) {
  if (!confirm(`Delete "${e.description}" (${gbp(e.amount / 100)})?`)) return
  await store.deleteExpense(e.id)
}

// --- CSV export ------------------------------------------------------------
function exportCsv() {
  const header = ['Date', 'Category', 'Description', 'Paid to', 'Miles', 'Amount', 'Notes']
  const rows = sortedPeriodExpenses.value.map((e) => [
    new Date(e.date).toLocaleDateString('en-GB'),
    categoryLabel(e.category),
    e.description,
    e.vendor || '',
    e.miles != null ? String(e.miles) : '',
    (e.amount / 100).toFixed(2),
    e.notes || '',
  ])
  const escape = (cell: string) => (/[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `expenses-${period.value}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

onMounted(() => {
  if (store.expenses.length === 0) store.fetchExpenses()
})
</script>
