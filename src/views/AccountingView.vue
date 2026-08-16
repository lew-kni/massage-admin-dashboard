<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Page header -->
    <div class="mb-8">
      <h1>Accounting</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">Track payments, expenses, and what you're owed.</p>
    </div>

    <div v-if="bookingsStore.loading && bookingsStore.bookings.length === 0" class="card p-8 text-center text-gray-500">
      Loading…
    </div>

    <template v-else>
      <!-- ============================== Tax Year ============================== -->
      <section class="mb-10">
        <div class="flex flex-wrap justify-between items-end gap-4 mb-4">
          <div>
            <h2 class="text-xl font-semibold">Tax Year</h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Income, expenses, and profit for a UK tax year (6 Apr – 5 Apr) — the figures that matter for Self Assessment.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="taxYearOffset++"
              class="btn-secondary text-sm px-3"
              aria-label="Previous tax year"
            ><i class="fas fa-chevron-left"></i></button>
            <span class="btn-secondary text-sm px-4 cursor-default select-none font-semibold min-w-[5rem] text-center">{{ taxYearLabel }}</span>
            <button
              @click="taxYearOffset--"
              :disabled="taxYearOffset === 0"
              class="btn-secondary text-sm px-3 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next tax year"
            ><i class="fas fa-chevron-right"></i></button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Income</p>
            <p class="text-3xl font-bold text-emerald-600 mt-2">{{ gbp(taxYearIncome) }}</p>
            <p class="text-xs text-gray-500 mt-1">money actually collected, {{ taxYearLabel }}</p>
          </div>
          <div class="card p-6">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Expenses</p>
            <p class="text-3xl font-bold text-red-600 mt-2">{{ gbp(taxYearExpensesTotal) }}</p>
            <p class="text-xs text-gray-500 mt-1">logged in Accounting → Expenses</p>
          </div>
          <div class="card p-6">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Profit</p>
            <p class="text-3xl font-bold mt-2" :class="taxYearProfit >= 0 ? 'text-sage-600' : 'text-red-600'">{{ gbp(taxYearProfit) }}</p>
            <p class="text-xs text-gray-500 mt-1">income minus expenses, {{ taxYearLabel }}</p>
          </div>
        </div>
      </section>

      <!-- ========================= General Accounting ========================= -->
      <section>
        <div class="flex flex-wrap justify-between items-start gap-4 mb-4">
          <div>
            <h2 class="text-xl font-semibold">General Accounting</h2>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">Day-to-day payment tracking and trends — not tied to the tax year.</p>
          </div>
          <button @click="exportCsv" class="btn-secondary text-sm" :disabled="generalPeriodBookings.length === 0">
            <i class="fas fa-file-arrow-down mr-1"></i>Export CSV
          </button>
        </div>

        <!-- Period selector -->
        <div class="flex gap-2 flex-wrap mb-6">
          <button
            v-for="opt in generalPeriodOptions"
            :key="opt.value"
            @click="generalPeriod = opt.value"
            :class="['btn-secondary text-sm', generalPeriod === opt.value && 'ring-2 ring-sage-500']"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Summary stat cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div class="card p-6">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Collected</p>
            <p class="text-3xl font-bold text-emerald-600 mt-2">{{ gbp(collected) }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ paymentsCount }} payment{{ paymentsCount === 1 ? '' : 's' }} received</p>
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
            <p class="text-xs text-gray-500 mb-4">Past sessions (all time) that still have a balance owing.</p>
            <div v-if="outstandingList.length === 0" class="text-center text-gray-500 py-6">
              <i class="fas fa-circle-check text-emerald-500 text-2xl mb-2"></i>
              <p>All caught up — nothing outstanding.</p>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                    <th class="px-3 py-2 font-semibold">Ref</th>
                    <th class="px-3 py-2 font-semibold">Date</th>
                    <th class="px-3 py-2 font-semibold">Client</th>
                    <th class="px-3 py-2 font-semibold">Service</th>
                    <th class="px-3 py-2 font-semibold text-right">Amount</th>
                    <th class="px-3 py-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in pagedOutstanding" :key="b.id" class="border-b border-gray-100 dark:border-gray-800 text-sm">
                    <td class="px-3 py-2">
                      <RouterLink :to="`/bookings/${b.id}`" class="text-sage-600 hover:text-sage-700 font-medium">{{ bookingRef(b) }}</RouterLink>
                    </td>
                    <td class="px-3 py-2 text-gray-600 dark:text-gray-300">{{ formatDate(b.startTime) }}</td>
                    <td class="px-3 py-2">{{ b.client?.firstName }} {{ b.client?.lastName }}</td>
                    <td class="px-3 py-2 text-gray-600 dark:text-gray-300">{{ b.service || '—' }}</td>
                    <td class="px-3 py-2 text-right font-medium">{{ gbp(outstandingBalance(b)) }}</td>
                    <td class="px-3 py-2 text-right">
                      <button @click="openMarkPaid(b)" class="btn-primary text-xs py-1 px-2 bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
                        <i class="fas fa-check-circle mr-1"></i>Mark Paid
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Pagination v-model="outstandingPage" :total-pages="totalOutstandingPages" />
            <p v-if="paymentError" class="mt-3 text-sm text-red-700">{{ paymentError }}</p>
          </div>
        </div>
      </section>
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
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { format } from 'date-fns'
import { useBookingsStore } from '@/stores/bookings'
import { useExpensesStore } from '@/stores/expenses'
import { taxYearStart, taxYearEnd } from '@/utils/mileage'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import type { Booking } from '@/types'
import { bookingTotal } from '@/utils/bookingTotal'
import { computeBookingTotals, sumPaymentsInRange, paymentsInRange, outstandingBalance, paymentMethodLabel, bookingRef } from '@/utils/bookingTotals'
import PaymentMethodModal from '@/components/PaymentMethodModal.vue'
import Pagination from '@/components/Pagination.vue'

const bookingsStore = useBookingsStore()
const expensesStore = useExpensesStore()

// --- helpers ---------------------------------------------------------------
// The amount actually charged: promotion-adjusted price when one applied.
function effectivePrice(b: Booking): number {
  return bookingTotal(b)
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

// Bookings that count towards the books: not cancelled and with a known price.
const accountable = computed(() =>
  bookingsStore.bookings.filter((b) => b.status !== 'CANCELLED' && (b.price != null || b.discountedPrice != null))
)

// ============================================================================
// Tax Year section — a single selectable UK tax year (6 Apr – 5 Apr), stepped
// backwards/forwards rather than a generic date-range picker, since that's
// the only unit that actually matters here (Self Assessment is filed per tax
// year, not per arbitrary period).
// ============================================================================
const taxYearOffset = ref(0) // 0 = current tax year, 1 = the one before, etc.
const taxYearRefDate = computed(() => {
  const n = toLondonFakeLocalDate(new Date())
  return new Date(n.getFullYear() - taxYearOffset.value, n.getMonth(), n.getDate())
})
const taxYearRange = computed(() => ({
  start: taxYearStart(taxYearRefDate.value),
  end: taxYearEnd(taxYearRefDate.value),
}))
// "2026/27" style label, matching how HMRC itself refers to a tax year.
const taxYearLabel = computed(() => {
  const startYear = taxYearStart(taxYearRefDate.value).getUTCFullYear()
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, '0')}`
})
function dateInTaxYear(dateStr: string): boolean {
  const t = new Date(dateStr).getTime()
  return t >= taxYearRange.value.start.getTime() && t < taxYearRange.value.end.getTime()
}

// "Income" = money actually received (cash basis), dated by when each payment
// landed (Payment.receivedAt) — the correct basis for a sole trader's Self
// Assessment, and what counts a late BACS in the tax year it was paid.
const taxYearIncome = computed(() =>
  sumPaymentsInRange(bookingsStore.bookings, taxYearRange.value.start.getTime(), taxYearRange.value.end.getTime())
)
const taxYearExpensesTotal = computed(() =>
  expensesStore.expenses
    .filter((e) => dateInTaxYear(e.date))
    .reduce((s, e) => s + e.amount, 0) / 100
)
const taxYearProfit = computed(() => taxYearIncome.value - taxYearExpensesTotal.value)

// ============================================================================
// General Accounting section — day-to-day payment tracking, independent of
// the tax year selector above.
// ============================================================================
type GeneralPeriod = 'month' | 'lastMonth' | 'last3Months' | 'last365Days' | 'calendarYear' | 'all'
const generalPeriod = ref<GeneralPeriod>('month')
const generalPeriodOptions: { value: GeneralPeriod; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'last3Months', label: 'Last 3 months' },
  { value: 'last365Days', label: 'Last 365 days' },
  { value: 'calendarYear', label: 'This calendar year' },
  { value: 'all', label: 'All time' },
]

const generalRange = computed(() => {
  const n = new Date()
  const startOfTomorrow = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1)
  switch (generalPeriod.value) {
    case 'month':
      return { start: new Date(n.getFullYear(), n.getMonth(), 1), end: new Date(n.getFullYear(), n.getMonth() + 1, 1) }
    case 'lastMonth':
      return { start: new Date(n.getFullYear(), n.getMonth() - 1, 1), end: new Date(n.getFullYear(), n.getMonth(), 1) }
    case 'last3Months':
      // Rolling window ending today, not calendar-month aligned.
      return { start: new Date(n.getFullYear(), n.getMonth() - 3, n.getDate()), end: startOfTomorrow }
    case 'last365Days':
      return { start: new Date(n.getTime() - 365 * 24 * 60 * 60 * 1000), end: startOfTomorrow }
    case 'calendarYear':
      return { start: new Date(n.getFullYear(), 0, 1), end: new Date(n.getFullYear() + 1, 0, 1) }
    default:
      return { start: new Date(0), end: new Date(8640000000000000) }
  }
})
function inGeneralPeriod(b: Booking): boolean {
  const t = new Date(b.startTime).getTime()
  return t >= generalRange.value.start.getTime() && t < generalRange.value.end.getTime()
}
const generalPeriodBookings = computed(() => accountable.value.filter(inGeneralPeriod))

// --- summary metrics ---------------------------------------------------------
// Collected = money received in the period (by receivedAt). Outstanding/upcoming
// use each booking's remaining balance, so a part-paid session shows only what's
// still owed rather than its whole total.
const collected = computed(() =>
  sumPaymentsInRange(bookingsStore.bookings, generalRange.value.start.getTime(), generalRange.value.end.getTime())
)
const paymentsCount = computed(() =>
  paymentsInRange(bookingsStore.bookings, generalRange.value.start.getTime(), generalRange.value.end.getTime()).length
)
const outstanding = computed(() =>
  generalPeriodBookings.value
    .filter((b) => b.status === 'CONFIRMED' && isPast(b))
    .reduce((s, b) => s + outstandingBalance(b), 0)
)
const upcoming = computed(() =>
  generalPeriodBookings.value
    .filter((b) => b.status === 'CONFIRMED' && !isPast(b))
    .reduce((s, b) => s + outstandingBalance(b), 0)
)
const sessionsCount = computed(() => generalPeriodBookings.value.length)
const avgValue = computed(() => (sessionsCount.value ? sum(generalPeriodBookings.value) / sessionsCount.value : 0))
const discountsGiven = computed(() =>
  generalPeriodBookings.value.reduce(
    (s, b) => s + (b.price != null && b.discountedPrice != null ? b.price - b.discountedPrice : 0),
    0
  )
)

// --- monthly trend (rolling 12 months, independent of either selector) ----
const monthlyRevenue = computed(() => {
  const n = toLondonFakeLocalDate(new Date())
  const months: { key: string; label: string; year: number; value: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(n.getFullYear(), n.getMonth() - i, 1)
    const start = d.getTime()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
    const value = sumPaymentsInRange(
      bookingsStore.bookings, start, end,
      (iso) => toLondonFakeLocalDate(iso).getTime(),
    )
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-GB', { month: 'short' }), year: d.getFullYear(), value })
  }
  return months
})
const maxMonthly = computed(() => Math.max(0, ...monthlyRevenue.value.map((m) => m.value)))

// --- payment method split (received in period) ----------------------------
// Aggregated across payment ROWS, so a split (part cash / part card) counts
// correctly under each method.
const methodRows = computed(() => {
  const ps = paymentsInRange(bookingsStore.bookings, generalRange.value.start.getTime(), generalRange.value.end.getTime())
  const totals: Record<string, number> = {}
  ps.forEach((p) => { totals[p.method] = (totals[p.method] || 0) + p.amount })
  const colors: Record<string, string> = {
    CASH: 'bg-emerald-500', BACS: 'bg-sky-500', CARD: 'bg-violet-500', VOUCHER: 'bg-amber-500', OTHER: 'bg-gray-400',
  }
  return (['CASH', 'BACS', 'CARD', 'VOUCHER', 'OTHER'] as const)
    .map((m) => ({ label: paymentMethodLabel(m), value: totals[m] || 0, color: colors[m] }))
    .filter((r) => r.value > 0)
})
const byMethod = computed(() => ({ total: methodRows.value.reduce((s, r) => s + r.value, 0) }))

// --- revenue by service (charged in period) -------------------------------
const byService = computed(() => {
  const map = new Map<string, { total: number; count: number }>()
  generalPeriodBookings.value.forEach((b) => {
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
    .filter((b) => b.status === 'CONFIRMED' && isPast(b) && outstandingBalance(b) > 0)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
)
const totalOutstandingAll = computed(() => outstandingList.value.reduce((s, b) => s + outstandingBalance(b), 0))

const PAGE_SIZE = 10
const outstandingPage = ref(1)
const totalOutstandingPages = computed(() => Math.max(1, Math.ceil(outstandingList.value.length / PAGE_SIZE)))
const pagedOutstanding = computed(() =>
  outstandingList.value.slice((outstandingPage.value - 1) * PAGE_SIZE, outstandingPage.value * PAGE_SIZE)
)
watch(totalOutstandingPages, (tp) => { if (outstandingPage.value > tp) outstandingPage.value = tp })

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
// Records a payment for the whole outstanding balance, settling the booking.
async function confirmPaid(method: 'CASH' | 'BACS') {
  if (!selectedBooking.value) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    await bookingsStore.addPayment(selectedBooking.value.id, {
      amount: outstandingBalance(selectedBooking.value),
      method,
      receivedAt: new Date().toISOString(),
    })
    showPaymentModal.value = false
    selectedBooking.value = null
  } catch (err: any) {
    paymentError.value = err?.message || 'Failed to record payment'
  } finally {
    savingPayment.value = false
  }
}

// --- CSV export (General Accounting's booking-level data) ------------------
function exportCsv() {
  const header = ['Booking', 'Date', 'Client', 'Service', 'List', 'Discounted', 'Charged', 'Paid', 'Balance', 'Methods', 'Payment status', 'Booking status']
  const rows = generalPeriodBookings.value
    .slice()
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map((b) => {
      const t = computeBookingTotals(b)
      return [
        bookingRef(b),
        new Date(b.startTime).toLocaleDateString('en-GB', { timeZone: 'Europe/London' }),
        `${b.client?.firstName ?? ''} ${b.client?.lastName ?? ''}`.trim(),
        b.service || '',
        b.price != null ? String(b.price) : '',
        b.discountedPrice != null ? String(b.discountedPrice) : '',
        String(effectivePrice(b)),
        String(t.amountPaid),
        String(outstandingBalance(b)),
        [...new Set((b.payments ?? []).map((p) => p.method))].join(';'),
        t.paymentStatus,
        b.status,
      ]
    })
  const escape = (cell: string | number) => {
    const s = String(cell)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `accounting-${generalPeriod.value}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(date: string): string {
  return format(toLondonFakeLocalDate(date), 'dd MMM yyyy')
}

onMounted(() => {
  if (bookingsStore.bookings.length === 0) bookingsStore.fetchBookings()
  if (expensesStore.expenses.length === 0) expensesStore.fetchExpenses()
})
</script>
