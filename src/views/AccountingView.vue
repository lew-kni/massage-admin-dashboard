<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
      <div>
        <h1>Accounting</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Track payments, revenue, and what you're owed.</p>
      </div>
      <button @click="exportCsv" class="btn-secondary text-sm" :disabled="periodBookings.length === 0">
        <i class="fas fa-file-arrow-down mr-1"></i>Export CSV
      </button>
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

    <div v-if="bookingsStore.loading && bookingsStore.bookings.length === 0" class="card p-8 text-center text-gray-500">
      Loading…
    </div>

    <template v-else>
      <!-- Income / Expenses / Profit -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Income</p>
          <p class="text-3xl font-bold text-emerald-600 mt-2">{{ gbp(collected) }}</p>
          <p class="text-xs text-gray-500 mt-1">money actually collected this period</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Expenses</p>
          <p class="text-3xl font-bold text-red-600 mt-2">{{ gbp(periodExpensesTotal) }}</p>
          <p class="text-xs text-gray-500 mt-1">logged in Accounting → Expenses</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Profit</p>
          <p class="text-3xl font-bold mt-2" :class="profit >= 0 ? 'text-sage-600' : 'text-red-600'">{{ gbp(profit) }}</p>
          <p class="text-xs text-gray-500 mt-1">income minus expenses, this period</p>
        </div>
      </div>

      <!-- Summary stat cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Collected</p>
          <p class="text-3xl font-bold text-emerald-600 mt-2">{{ gbp(collected) }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ paidCount }} paid session{{ paidCount === 1 ? '' : 's' }}</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Outstanding</p>
          <p class="text-3xl font-bold text-amber-600 mt-2">{{ gbp(outstanding) }}</p>
          <p class="text-xs text-gray-500 mt-1">owed from completed sessions</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Upcoming</p>
          <p class="text-3xl font-bold text-sky-600 mt-2">{{ gbp(upcoming) }}</p>
          <p class="text-xs text-gray-500 mt-1">expected from future bookings</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg. booking value</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{{ gbp(avgValue) }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ sessionsCount }} session{{ sessionsCount === 1 ? '' : 's' }} · {{ gbp(discountsGiven) }} discounts given</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Monthly revenue trend -->
        <div class="card lg:col-span-2">
          <div class="card-header">
            <h2 class="text-lg font-semibold"><i class="fas fa-chart-column mr-2"></i>Collected — last 12 months</h2>
          </div>
          <div class="card-body">
            <div v-if="maxMonthly === 0" class="text-center text-gray-500 py-8">No payments recorded yet.</div>
            <div v-else class="flex items-end gap-2 h-48">
              <div v-for="m in monthlyRevenue" :key="m.key" class="flex-1 flex flex-col items-center justify-end h-full" :title="`${m.label} ${m.year}: ${gbp(m.value)}`">
                <span class="text-xs text-gray-500 mb-1" :class="{ 'opacity-0': m.value === 0 }">{{ compactGbp(m.value) }}</span>
                <div
                  class="w-full rounded-t bg-sage-500 hover:bg-sage-600 transition-all"
                  :style="{ height: `${Math.round((m.value / maxMonthly) * 100)}%`, minHeight: m.value > 0 ? '4px' : '0' }"
                ></div>
                <span class="text-xs text-gray-500 mt-1">{{ m.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment methods -->
        <div class="card">
          <div class="card-header">
            <h2 class="text-lg font-semibold"><i class="fas fa-money-bill-wave mr-2"></i>Payment methods</h2>
          </div>
          <div class="card-body space-y-4">
            <div v-if="byMethod.total === 0" class="text-center text-gray-500 py-4">No payments in this period.</div>
            <template v-else>
              <div v-for="row in methodRows" :key="row.label">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600 dark:text-gray-300">{{ row.label }}</span>
                  <span class="font-medium">{{ gbp(row.value) }} <span class="text-gray-400">· {{ pct(row.value, byMethod.total) }}%</span></span>
                </div>
                <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div class="h-full rounded-full" :class="row.color" :style="{ width: `${pct(row.value, byMethod.total)}%` }"></div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Revenue by service -->
      <div class="card mb-8">
        <div class="card-header">
          <h2 class="text-lg font-semibold"><i class="fas fa-list mr-2"></i>Revenue by service</h2>
        </div>
        <div class="card-body">
          <div v-if="byService.length === 0" class="text-center text-gray-500 py-4">No bookings in this period.</div>
          <div v-else class="space-y-3">
            <div v-for="row in byService" :key="row.name">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-gray-700 dark:text-gray-300">{{ row.name }} <span class="text-gray-400">({{ row.count }})</span></span>
                <span class="font-medium">{{ gbp(row.total) }}</span>
              </div>
              <div class="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div class="h-full rounded-full bg-sage-500" :style="{ width: `${pct(row.total, byServiceMax)}%` }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Outstanding payments (actionable, all-time) -->
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <h2 class="text-lg font-semibold"><i class="fas fa-hand-holding-dollar mr-2"></i>Outstanding payments</h2>
          <span v-if="outstandingList.length" class="badge bg-amber-100 text-amber-800">{{ gbp(totalOutstandingAll) }} across {{ outstandingList.length }}</span>
        </div>
        <div class="card-body">
          <p class="text-xs text-gray-500 mb-4">Completed sessions (all time) that haven't been marked paid yet.</p>
          <div v-if="outstandingList.length === 0" class="text-center text-gray-500 py-6">
            <i class="fas fa-circle-check text-emerald-500 text-2xl mb-2"></i>
            <p>All caught up — nothing outstanding.</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                  <th class="px-3 py-2 font-semibold">#</th>
                  <th class="px-3 py-2 font-semibold">Date</th>
                  <th class="px-3 py-2 font-semibold">Client</th>
                  <th class="px-3 py-2 font-semibold">Service</th>
                  <th class="px-3 py-2 font-semibold text-right">Amount</th>
                  <th class="px-3 py-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in outstandingList" :key="b.id" class="border-b border-gray-100 dark:border-gray-800 text-sm">
                  <td class="px-3 py-2">
                    <RouterLink :to="`/bookings/${b.id}`" class="text-sage-600 hover:text-sage-700 font-medium">#{{ b.bookingNumber }}</RouterLink>
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-300">{{ formatDate(b.startTime) }}</td>
                  <td class="px-3 py-2">{{ b.client?.firstName }} {{ b.client?.lastName }}</td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-300">{{ b.service || '—' }}</td>
                  <td class="px-3 py-2 text-right font-medium">{{ gbp(effectivePrice(b)) }}</td>
                  <td class="px-3 py-2 text-right">
                    <button @click="openMarkPaid(b)" class="btn-primary text-xs py-1 px-2 bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                      <i class="fas fa-check-circle mr-1"></i>Mark Paid
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="paymentError" class="mt-3 text-sm text-red-700">{{ paymentError }}</p>
        </div>
      </div>
    </template>

    <PaymentMethodModal
      v-if="showPaymentModal"
      :saving="savingPayment"
      @close="showPaymentModal = false"
      @confirm="confirmPaid"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { useBookingsStore } from '@/stores/bookings'
import { useExpensesStore } from '@/stores/expenses'
import { taxYearStart, taxYearEnd } from '@/utils/mileage'
import type { Booking } from '@/types'
import PaymentMethodModal from '@/components/PaymentMethodModal.vue'

const bookingsStore = useBookingsStore()
const expensesStore = useExpensesStore()

// taxYear/lastTaxYear alongside the calendar-based options for the same
// reason as the Expenses view: at filing time you want the tax year that
// just closed, not "this year"/"this month".
type Period = 'month' | 'lastMonth' | 'taxYear' | 'lastTaxYear' | 'year' | 'all'
const period = ref<Period>('month')
const periodOptions: { value: Period; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'taxYear', label: 'This tax year' },
  { value: 'lastTaxYear', label: 'Last tax year' },
  { value: 'year', label: 'This calendar year' },
  { value: 'all', label: 'All time' },
]

// --- helpers ---------------------------------------------------------------
// The amount actually charged: promotion-adjusted price when one applied.
function effectivePrice(b: Booking): number {
  return (b.discountedPrice ?? b.price ?? 0) || 0
}
function isPast(b: Booking): boolean {
  return new Date(b.startTime) <= new Date()
}
function sum(list: Booking[]): number {
  return list.reduce((s, b) => s + effectivePrice(b), 0)
}
const gbp = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')
const compactGbp = (n: number) => (n >= 1000 ? '£' + (n / 1000).toFixed(1) + 'k' : '£' + Math.round(n))
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// --- period scoping --------------------------------------------------------
const periodRange = computed(() => {
  const n = new Date()
  switch (period.value) {
    case 'month':
      return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: new Date(n.getFullYear(), n.getMonth() + 1, 1) }
    case 'lastMonth':
      return { start: new Date(n.getFullYear(), n.getMonth() - 1, 1), end: new Date(n.getFullYear(), n.getMonth(), 1) }
    case 'taxYear':
      return { start: taxYearStart(n), end: taxYearEnd(n) }
    case 'lastTaxYear': {
      const aYearAgo = new Date(n.getFullYear() - 1, n.getMonth(), n.getDate())
      return { start: taxYearStart(aYearAgo), end: taxYearEnd(aYearAgo) }
    }
    case 'year':
      return { start: new Date(n.getFullYear(), 0, 1), end: new Date(n.getFullYear() + 1, 0, 1) }
    default:
      return { start: new Date(0), end: new Date(8640000000000000) }
  }
})
function inPeriod(b: Booking): boolean {
  const t = new Date(b.startTime).getTime()
  return t >= periodRange.value.start.getTime() && t < periodRange.value.end.getTime()
}
function dateInPeriod(dateStr: string): boolean {
  const t = new Date(dateStr).getTime()
  return t >= periodRange.value.start.getTime() && t < periodRange.value.end.getTime()
}

// Bookings that count towards the books: not cancelled and with a known price.
const accountable = computed(() =>
  bookingsStore.bookings.filter((b) => b.status !== 'CANCELLED' && (b.price != null || b.discountedPrice != null))
)
const periodBookings = computed(() => accountable.value.filter(inPeriod))

// --- summary metrics -------------------------------------------------------
const paidBookings = computed(() => periodBookings.value.filter((b) => b.isPaid))
const collected = computed(() => sum(paidBookings.value))
const paidCount = computed(() => paidBookings.value.length)
const outstanding = computed(() =>
  sum(periodBookings.value.filter((b) => !b.isPaid && b.status === 'CONFIRMED' && isPast(b)))
)
const upcoming = computed(() =>
  sum(periodBookings.value.filter((b) => !b.isPaid && b.status === 'CONFIRMED' && !isPast(b)))
)
const sessionsCount = computed(() => periodBookings.value.length)
const avgValue = computed(() => (sessionsCount.value ? sum(periodBookings.value) / sessionsCount.value : 0))

// --- income / expenses / profit --------------------------------------------
// "Income" here deliberately means money actually collected in the period,
// not money billed/invoiced — the right basis for a cash-basis sole trader's
// Self Assessment, and what the "Collected" figure above already tracks.
const periodExpensesTotal = computed(() =>
  expensesStore.expenses
    .filter((e) => dateInPeriod(e.date))
    .reduce((s, e) => s + e.amount, 0) / 100
)
const profit = computed(() => collected.value - periodExpensesTotal.value)
const discountsGiven = computed(() =>
  periodBookings.value.reduce(
    (s, b) => s + (b.price != null && b.discountedPrice != null ? b.price - b.discountedPrice : 0),
    0
  )
)

// --- monthly trend (rolling 12 months, independent of period) -------------
const monthlyRevenue = computed(() => {
  const n = new Date()
  const months: { key: string; label: string; year: number; value: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(n.getFullYear(), n.getMonth() - i, 1)
    const start = d.getTime()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
    const value = sum(
      accountable.value.filter((b) => {
        const t = new Date(b.startTime).getTime()
        return b.isPaid && t >= start && t < end
      })
    )
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-GB', { month: 'short' }), year: d.getFullYear(), value })
  }
  return months
})
const maxMonthly = computed(() => Math.max(0, ...monthlyRevenue.value.map((m) => m.value)))

// --- payment method split (collected in period) ---------------------------
const byMethod = computed(() => {
  const paid = paidBookings.value
  const cash = sum(paid.filter((b) => b.paymentMethod === 'CASH'))
  const bacs = sum(paid.filter((b) => b.paymentMethod === 'BACS'))
  const unknown = sum(paid.filter((b) => !b.paymentMethod))
  return { cash, bacs, unknown, total: cash + bacs + unknown }
})
const methodRows = computed(() =>
  [
    { label: 'Cash', value: byMethod.value.cash, color: 'bg-emerald-500' },
    { label: 'BACS', value: byMethod.value.bacs, color: 'bg-sky-500' },
    { label: 'Unspecified', value: byMethod.value.unknown, color: 'bg-gray-400' },
  ].filter((r) => r.value > 0)
)

// --- revenue by service (charged in period) -------------------------------
const byService = computed(() => {
  const map = new Map<string, { total: number; count: number }>()
  periodBookings.value.forEach((b) => {
    const key = b.service || 'Unspecified'
    const cur = map.get(key) || { total: 0, count: 0 }
    cur.total += effectivePrice(b)
    cur.count += 1
    map.set(key, cur)
  })
  return [...map.entries()]
    .map(([name, v]) => ({ name, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total)
})
const byServiceMax = computed(() => Math.max(1, ...byService.value.map((s) => s.total)))

// --- outstanding payments (actionable, all time) --------------------------
const outstandingList = computed(() =>
  accountable.value
    .filter((b) => !b.isPaid && b.status === 'CONFIRMED' && isPast(b))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
)
const totalOutstandingAll = computed(() => sum(outstandingList.value))

// --- mark as paid ----------------------------------------------------------
const showPaymentModal = ref(false)
const selectedBooking = ref<Booking | null>(null)
const savingPayment = ref(false)
const paymentError = ref('')

function openMarkPaid(b: Booking) {
  selectedBooking.value = b
  paymentError.value = ''
  showPaymentModal.value = true
}
async function confirmPaid(method: 'CASH' | 'BACS') {
  if (!selectedBooking.value) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    await bookingsStore.updateBooking(selectedBooking.value.id, { isPaid: true, paymentMethod: method } as Partial<Booking>)
    showPaymentModal.value = false
    selectedBooking.value = null
  } catch (err: any) {
    paymentError.value = err?.message || 'Failed to mark as paid'
  } finally {
    savingPayment.value = false
  }
}

// --- CSV export ------------------------------------------------------------
function exportCsv() {
  const header = ['Booking', 'Date', 'Client', 'Service', 'List', 'Discounted', 'Charged', 'Paid', 'Method', 'Status']
  const rows = periodBookings.value
    .slice()
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map((b) => [
      '#' + b.bookingNumber,
      new Date(b.startTime).toLocaleDateString('en-GB'),
      `${b.client?.firstName ?? ''} ${b.client?.lastName ?? ''}`.trim(),
      b.service || '',
      b.price != null ? String(b.price) : '',
      b.discountedPrice != null ? String(b.discountedPrice) : '',
      String(effectivePrice(b)),
      b.isPaid ? 'Yes' : 'No',
      b.paymentMethod || '',
      b.status,
    ])
  const escape = (cell: string | number) => {
    const s = String(cell)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `accounting-${period.value}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

onMounted(() => {
  if (bookingsStore.bookings.length === 0) bookingsStore.fetchBookings()
  if (expensesStore.expenses.length === 0) expensesStore.fetchExpenses()
})
</script>
