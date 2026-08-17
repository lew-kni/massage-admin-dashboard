<template>
  <div class="p-8 dark:text-gray-50">
    <!-- Page header -->
    <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
      <div>
        <h1>Self Assessment</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Everything the SA103S self-employment pages ask for, collated for one tax year — turnover, expenses
          grouped into HMRC's boxes, and your profit or loss.
        </p>
      </div>
      <div class="flex gap-2">
        <button @click="copyFigures" class="btn-secondary text-sm">
          <i class="fas fa-copy mr-1"></i>{{ copied ? 'Copied!' : 'Copy figures' }}
        </button>
        <button @click="exportCsv" class="btn-secondary text-sm">
          <i class="fas fa-file-arrow-down mr-1"></i>Export CSV
        </button>
      </div>
    </div>

    <!-- Tax-year selector -->
    <div class="flex flex-wrap justify-between items-center gap-4 mb-6">
      <div class="flex items-center gap-2">
        <button @click="taxYearOffset++" class="btn-secondary text-sm px-3" aria-label="Previous tax year">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="btn-secondary text-sm px-4 cursor-default select-none font-semibold min-w-[5rem] text-center">{{ taxYearLabel }}</span>
        <button
          @click="taxYearOffset--"
          :disabled="taxYearOffset === 0"
          class="btn-secondary text-sm px-3 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next tax year"
        ><i class="fas fa-chevron-right"></i></button>
      </div>
      <p class="text-sm text-gray-500">Tax year {{ taxYearLabel }} · 6 Apr {{ startYear }} – 5 Apr {{ startYear + 1 }}</p>
    </div>

    <div v-if="loading" class="card p-8 text-center text-gray-500">Loading…</div>

    <template v-else>
      <!-- ===================== Filing summary (the boxes) ===================== -->
      <section class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Turnover <span class="text-gray-400">· box 9</span></p>
            <p class="text-3xl font-bold text-emerald-600 mt-2">{{ gbp(turnover) }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ paidSessions }} paid session{{ paidSessions === 1 ? '' : 's' }} collected</p>
          </div>
          <div class="card p-6">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Total allowable expenses <span class="text-gray-400">· box 20</span></p>
            <p class="text-3xl font-bold text-red-600 mt-2">{{ gbp(totalExpenses) }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ taxYearExpenses.length }} expense{{ taxYearExpenses.length === 1 ? '' : 's' }} logged</p>
          </div>
          <div class="card p-6">
            <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">
              {{ isLoss ? 'Net loss' : 'Net profit' }} <span class="text-gray-400">· box {{ isLoss ? NET_LOSS_BOX : NET_PROFIT_BOX }}</span>
            </p>
            <p class="text-3xl font-bold mt-2" :class="isLoss ? 'text-red-600' : 'text-sage-600'">{{ gbp(Math.abs(netResult)) }}</p>
            <p class="text-xs text-gray-500 mt-1">turnover minus expenses</p>
          </div>
        </div>
      </section>

      <!-- Simplified-filing shortcut -->
      <div v-if="turnover < SIMPLIFIED_TURNOVER_LIMIT" class="card p-4 mb-8 border-l-4 border-sage-500 bg-sage-50 dark:bg-gray-800">
        <p class="text-sm">
          <i class="fas fa-circle-info text-sage-600 mr-1"></i>
          Your turnover is below £85,000, so you can skip the box-by-box breakdown and just enter your
          <strong>total expenses of {{ gbp(totalExpenses) }} in box 20</strong>. The breakdown below is here if you'd
          rather itemise, or want it for your records.
        </p>
      </div>

      <!-- ===================== Expenses by SA103S box ===================== -->
      <div class="card mb-8">
        <div class="card-header flex justify-between items-center">
          <h2 class="text-lg font-semibold"><i class="fas fa-table-list mr-2"></i>Expenses by SA103S box</h2>
          <button v-if="hasZeroBoxes" @click="showAllBoxes = !showAllBoxes" class="text-xs text-sage-600 hover:text-sage-700">
            {{ showAllBoxes ? 'Hide empty boxes' : 'Show all boxes' }}
          </button>
        </div>
        <div class="card-body">
          <div v-if="totalExpenses === 0" class="text-center text-gray-500 py-6">No expenses logged for {{ taxYearLabel }} yet.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                  <th class="px-3 py-2 font-semibold w-14">Box</th>
                  <th class="px-3 py-2 font-semibold">HMRC category</th>
                  <th class="px-3 py-2 font-semibold">Your entries</th>
                  <th class="px-3 py-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in visibleBoxRows"
                  :key="row.box"
                  class="border-b border-gray-100 dark:border-gray-800 text-sm"
                  :class="{ 'opacity-50': row.total === 0 }"
                >
                  <td class="px-3 py-2 font-mono font-semibold text-gray-500">{{ row.box }}</td>
                  <td class="px-3 py-2">{{ row.label }}</td>
                  <td class="px-3 py-2 text-gray-500 text-xs">{{ row.categories.join(', ') || '—' }}</td>
                  <td class="px-3 py-2 text-right font-medium">{{ gbp(row.total) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                  <td class="px-3 py-2 font-mono">{{ TOTAL_EXPENSES_BOX }}</td>
                  <td class="px-3 py-2" colspan="2">Total allowable expenses</td>
                  <td class="px-3 py-2 text-right">{{ gbp(totalExpenses) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Mileage callout -->
      <div v-if="mileageMiles > 0" class="card p-4 mb-8 text-sm text-gray-600 dark:text-gray-300">
        <i class="fas fa-road text-sage-600 mr-1"></i>
        <strong>{{ mileageMiles.toLocaleString('en-GB') }} business miles</strong> logged this tax year, claimed at HMRC's
        AMAP rates ({{ gbp(mileageAmount) }}, included in box 12). Keep your mileage log in case HMRC asks.
      </div>

      <!-- ===================== Readiness & notes ===================== -->
      <div class="card mb-8">
        <div class="card-header">
          <h2 class="text-lg font-semibold"><i class="fas fa-clipboard-check mr-2"></i>Before you file — checks &amp; notes</h2>
        </div>
        <div class="card-body space-y-3">
          <div v-for="note in notes" :key="note.text" class="flex items-start gap-3 text-sm">
            <i class="mt-0.5 fas" :class="note.icon + ' ' + note.color"></i>
            <p class="text-gray-700 dark:text-gray-300" v-html="note.text"></p>
          </div>
        </div>
      </div>

      <!-- ===================== Key dates ===================== -->
      <div class="card">
        <div class="card-header">
          <h2 class="text-lg font-semibold"><i class="fas fa-calendar-day mr-2"></i>Key dates for {{ taxYearLabel }}</h2>
        </div>
        <div class="card-body">
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="d in keyDates" :key="d.label" class="border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td class="py-2 text-gray-600 dark:text-gray-400">{{ d.label }}</td>
                <td class="py-2 text-right font-medium" :class="d.emphasis ? 'text-sage-700 dark:text-sage-400' : ''">{{ d.date }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-gray-500 mt-4">
            These figures are a bookkeeping aid, not a filed return or formal tax advice — check the box treatment of
            course fees and any pre-trading costs with an accountant before submitting.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBookingsStore } from '@/stores/bookings'
import { useExpensesStore } from '@/stores/expenses'
import { taxYearStart, taxYearEnd } from '@/utils/mileage'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import { categoryLabel } from '@/constants/expenseCategories'
import {
  SA103S_EXPENSE_BOXES,
  SIMPLIFIED_TURNOVER_LIMIT,
  TOTAL_EXPENSES_BOX,
  NET_PROFIT_BOX,
  NET_LOSS_BOX,
  sa103sBoxForCategory,
} from '@/constants/sa103s'
import type { Booking } from '@/types'
import { bookingTotal } from '@/utils/bookingTotal'
import { computeBookingTotals } from '@/utils/bookingTotals'

const bookingsStore = useBookingsStore()
const expensesStore = useExpensesStore()

const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const loading = computed(
  () =>
    (bookingsStore.loading && bookingsStore.bookings.length === 0) ||
    (expensesStore.loading && expensesStore.expenses.length === 0)
)

// --- tax-year selection (stepped, like the Accounting dashboard) -----------
const taxYearOffset = ref(0) // 0 = current tax year, 1 = the one before, etc.
const refDate = computed(() => {
  const n = toLondonFakeLocalDate(new Date())
  return new Date(n.getFullYear() - taxYearOffset.value, n.getMonth(), n.getDate())
})
const range = computed(() => ({ start: taxYearStart(refDate.value), end: taxYearEnd(refDate.value) }))
const startYear = computed(() => taxYearStart(refDate.value).getUTCFullYear())
const taxYearLabel = computed(() => `${startYear.value}/${String((startYear.value + 1) % 100).padStart(2, '0')}`)

function inRange(dateStr: string): boolean {
  const t = new Date(dateStr).getTime()
  return t >= range.value.start.getTime() && t < range.value.end.getTime()
}

// --- turnover (money actually collected — cash basis) ----------------------
function effectivePrice(b: Booking): number {
  return bookingTotal(b)
}
// A booking counts as turnover once it's fully paid. Derived from the payments
// model (paymentStatus) rather than the retired isPaid flag.
const paidInYear = computed(() =>
  bookingsStore.bookings.filter(
    (b) =>
      b.status !== 'CANCELLED' &&
      computeBookingTotals(b).paymentStatus === 'PAID' &&
      (b.price != null || b.discountedPrice != null) &&
      inRange(b.startTime)
  )
)
const turnover = computed(() => paidInYear.value.reduce((s, b) => s + effectivePrice(b), 0))
const paidSessions = computed(() => paidInYear.value.length)

// --- expenses --------------------------------------------------------------
const taxYearExpenses = computed(() => expensesStore.expenses.filter((e) => inRange(e.date)))
const totalExpenses = computed(() => taxYearExpenses.value.reduce((s, e) => s + e.amount, 0) / 100)

const netResult = computed(() => turnover.value - totalExpenses.value)
const isLoss = computed(() => netResult.value < 0)

// Per-box totals + which of our categories fed each box.
const boxRows = computed(() => {
  const totals = new Map<number, number>()
  const cats = new Map<number, Set<string>>()
  for (const e of taxYearExpenses.value) {
    const box = sa103sBoxForCategory(e.category)
    totals.set(box, (totals.get(box) || 0) + e.amount / 100)
    if (!cats.has(box)) cats.set(box, new Set())
    cats.get(box)!.add(categoryLabel(e.category))
  }
  return SA103S_EXPENSE_BOXES.map((b) => ({
    box: b.box,
    label: b.label,
    total: totals.get(b.box) || 0,
    categories: [...(cats.get(b.box) || [])],
  }))
})
const hasZeroBoxes = computed(() => boxRows.value.some((r) => r.total === 0))
const showAllBoxes = ref(false)
const visibleBoxRows = computed(() => (showAllBoxes.value ? boxRows.value : boxRows.value.filter((r) => r.total > 0)))

// --- mileage (informational) -----------------------------------------------
const mileageExpenses = computed(() => taxYearExpenses.value.filter((e) => e.category === 'MILEAGE'))
const mileageMiles = computed(() => mileageExpenses.value.reduce((s, e) => s + (e.miles || 0), 0))
const mileageAmount = computed(() => mileageExpenses.value.reduce((s, e) => s + e.amount, 0) / 100)

// --- category totals used by the notes -------------------------------------
function categoryTotal(cat: string): number {
  return taxYearExpenses.value.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0) / 100
}
const missingReceipts = computed(() => taxYearExpenses.value.filter((e) => e.category !== 'MILEAGE' && !e.receiptCount).length)

// --- dynamic readiness notes -----------------------------------------------
interface Note { text: string; icon: string; color: string }
const notes = computed<Note[]>(() => {
  const out: Note[] = []
  const ok = { icon: 'fa-circle-check', color: 'text-emerald-500' }
  const warn = { icon: 'fa-triangle-exclamation', color: 'text-amber-500' }
  const info = { icon: 'fa-circle-info', color: 'text-sky-500' }

  if (turnover.value === 0 && totalExpenses.value > 0) {
    out.push({
      text: 'No income collected this year but expenses are logged — these may be <strong>pre-trading expenses</strong>, which HMRC treats as incurred on your first day of trading. Confirm your trading start date so they land in the right year.',
      ...info,
    })
  }
  if (turnover.value > 0 && turnover.value <= 1000) {
    out.push({
      text: 'Turnover is under the £1,000 <strong>trading allowance</strong> — you may not need to report it at all. But to claim a loss you must file and <em>not</em> use the allowance.',
      ...info,
    })
  }
  if (categoryTotal('TRAINING') > 0) {
    out.push({
      text: `${gbp(categoryTotal('TRAINING'))} of training is in box 19. Ongoing CPD is allowable, but the cost of an <strong>initial qualification to start the trade is capital and usually not deductible</strong> — check this one.`,
      ...warn,
    })
  }
  if (categoryTotal('INSURANCE_MEMBERSHIP') === 0) {
    out.push({
      text: 'No insurance or membership logged. Public liability / professional indemnity premiums are allowable (box 14) — add them once purchased.',
      ...warn,
    })
  }
  if (mileageMiles.value === 0) {
    out.push({
      text: "No mileage logged. For a <strong>mobile</strong> therapist this is often the biggest deduction (45p/mile) — keep a log and add it as you go.",
      ...warn,
    })
  }
  if (missingReceipts.value > 0) {
    out.push({
      text: `${missingReceipts.value} expense${missingReceipts.value === 1 ? '' : 's'} ${missingReceipts.value === 1 ? 'has' : 'have'} no receipt attached. HMRC can ask for evidence — upload them in Accounting → Receipts.`,
      ...warn,
    })
  } else if (totalExpenses.value > 0) {
    out.push({ text: 'Every expense this year is backed by a receipt — exactly what HMRC expects you to be able to produce.', ...ok })
  }
  out.push({
    text: 'Figures are on a <strong>cash basis</strong> (income when paid, expenses when paid) — the default for a sole trader your size. Keep these records for ~5 years after the filing deadline.',
    ...info,
  })
  return out
})

// --- key dates for the selected tax year -----------------------------------
const keyDates = computed(() => {
  const y = startYear.value
  return [
    { label: 'Tax year', date: `6 Apr ${y} – 5 Apr ${y + 1}`, emphasis: false },
    { label: 'Register for Self Assessment by (if first year)', date: `5 Oct ${y + 1}`, emphasis: false },
    { label: 'Paper return deadline', date: `31 Oct ${y + 1}`, emphasis: false },
    { label: 'Online return + payment deadline', date: `31 Jan ${y + 2}`, emphasis: true },
  ]
})

// --- copy / export ---------------------------------------------------------
const copied = ref(false)
function summaryLines(): string[] {
  const lines = [
    `North Peak Massage — SA103S figures for ${taxYearLabel.value}`,
    `Box 9  Turnover: ${gbp(turnover.value)}`,
    ...boxRows.value.filter((r) => r.total > 0).map((r) => `Box ${r.box} ${r.label}: ${gbp(r.total)}`),
    `Box ${TOTAL_EXPENSES_BOX} Total allowable expenses: ${gbp(totalExpenses.value)}`,
    `Box ${isLoss.value ? NET_LOSS_BOX : NET_PROFIT_BOX} Net ${isLoss.value ? 'loss' : 'profit'}: ${gbp(Math.abs(netResult.value))}`,
  ]
  return lines
}
async function copyFigures() {
  try {
    await navigator.clipboard.writeText(summaryLines().join('\n'))
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    /* clipboard unavailable — no-op */
  }
}
function exportCsv() {
  const rows: (string | number)[][] = [['Box', 'Description', 'Amount']]
  rows.push(['9', 'Turnover', turnover.value.toFixed(2)])
  boxRows.value.filter((r) => r.total > 0).forEach((r) => rows.push([r.box, r.label, r.total.toFixed(2)]))
  rows.push([TOTAL_EXPENSES_BOX, 'Total allowable expenses', totalExpenses.value.toFixed(2)])
  rows.push([isLoss.value ? NET_LOSS_BOX : NET_PROFIT_BOX, `Net ${isLoss.value ? 'loss' : 'profit'}`, Math.abs(netResult.value).toFixed(2)])
  const escape = (c: string | number) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c))
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `self-assessment-${taxYearLabel.value.replace('/', '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  if (bookingsStore.bookings.length === 0) bookingsStore.fetchBookings()
  if (expensesStore.expenses.length === 0) expensesStore.fetchExpenses()
})
</script>
