<template>
  <div class="p-8 dark:text-gray-50">
    <RouterLink to="/accounting/vendors" class="text-sm text-sage-600 hover:text-sage-700">
      <i class="fas fa-chevron-left mr-1"></i>Back to vendors
    </RouterLink>

    <div v-if="loading" class="card p-8 text-center text-gray-500 mt-4">Loading…</div>
    <div v-else-if="error" class="card p-8 text-center text-red-700 mt-4">{{ error }}</div>

    <template v-else-if="vendor">
      <!-- Header -->
      <div class="flex flex-wrap justify-between items-start gap-4 mt-4 mb-6">
        <div>
          <h1>{{ vendor.name }}</h1>
          <p v-if="vendor.defaultCategory" class="mt-2">
            <span class="badge bg-sage-100 text-sage-800">{{ categoryLabel(vendor.defaultCategory) }}</span>
            <span class="text-gray-500 text-sm ml-1">default category</span>
          </p>
          <p v-if="vendor.notes" class="text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-line">{{ vendor.notes }}</p>
        </div>
        <button @click="showEdit = true" class="btn-secondary text-sm"><i class="fas fa-pen mr-1"></i>Edit</button>
      </div>

      <!-- Totals -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Total spent</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{{ gbp(vendor.totalSpent / 100) }}</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Expenses</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{{ vendor.expenseCount }}</p>
        </div>
        <div class="card p-6">
          <p class="text-gray-600 dark:text-gray-400 text-sm font-medium">Receipts</p>
          <p class="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-2">{{ vendor.receiptCount }}</p>
        </div>
      </div>

      <!-- Expenses -->
      <div class="card mb-8">
        <div class="card-header flex justify-between items-center">
          <h2 class="text-lg font-semibold"><i class="fas fa-money-bill-wave mr-2"></i>Expenses</h2>
          <div class="flex gap-2">
            <button @click="showRecurringForm = true" class="btn-secondary text-sm"><i class="fas fa-repeat mr-1"></i>Add recurring</button>
            <button @click="showExpenseForm = true" class="btn-secondary text-sm"><i class="fas fa-plus mr-1"></i>Add expense</button>
          </div>
        </div>
        <div class="card-body">
          <div v-if="vendor.expenses.length === 0" class="text-center text-gray-500 py-6">No expenses logged against this vendor.</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b-2 border-gray-200 dark:border-gray-700 text-left text-sm text-gray-600 dark:text-gray-400">
                  <th class="px-3 py-2 font-semibold">Date</th>
                  <th class="px-3 py-2 font-semibold">Category</th>
                  <th class="px-3 py-2 font-semibold">Description</th>
                  <th class="px-3 py-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in vendor.expenses" :key="e.id" class="border-b border-gray-100 dark:border-gray-800 text-sm">
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDate(e.date) }}</td>
                  <td class="px-3 py-2"><span class="badge bg-sage-100 text-sage-800">{{ categoryLabel(e.category) }}</span></td>
                  <td class="px-3 py-2">
                    {{ e.description }}
                    <i v-if="e.receiptCount" class="fas fa-paperclip text-gray-400 text-xs ml-1"></i>
                  </td>
                  <td class="px-3 py-2 text-right font-medium">{{ gbp(e.amount / 100) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Receipts -->
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <h2 class="text-lg font-semibold"><i class="fas fa-receipt mr-2"></i>Receipts</h2>
          <button @click="showReceiptUpload = true" class="btn-secondary text-sm"><i class="fas fa-upload mr-1"></i>Upload receipt</button>
        </div>
        <div class="card-body">
          <div v-if="vendor.receipts.length === 0" class="text-center text-gray-500 py-6">No receipts filed under this vendor.</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div
              v-for="r in vendor.receipts"
              :key="r.id"
              class="card p-4 cursor-pointer hover:ring-2 hover:ring-sage-500 transition-all"
              @click="activeReceiptId = r.id"
            >
              <p class="font-medium mb-1"><i :class="fileIcon(r.fileType)" class="text-gray-400 mr-1"></i>{{ r.fileName }}</p>
              <p class="text-xs text-gray-500">{{ r.date ? formatDate(r.date) : 'No date' }}<template v-if="r.totalAmount != null"> · {{ gbp(r.totalAmount / 100) }}</template></p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <VendorFormModal
      v-if="showEdit && vendor"
      :vendor="vendor"
      @close="showEdit = false"
      @saved="onVendorSaved"
    />
    <ExpenseFormModal
      v-if="showExpenseForm && vendor"
      :initial-vendor-id="vendor.id"
      @close="showExpenseForm = false"
      @saved="onChildSaved"
    />
    <RecurringExpenseFormModal
      v-if="showRecurringForm && vendor"
      :initial-vendor-id="vendor.id"
      @close="showRecurringForm = false"
      @saved="onChildSaved"
    />
    <ReceiptUploadModal
      v-if="showReceiptUpload && vendor"
      :initial-vendor-id="vendor.id"
      @close="showReceiptUpload = false"
      @saved="onChildSaved"
    />
    <ReceiptDetailModal
      v-if="activeReceiptId"
      :receipt-id="activeReceiptId"
      @close="activeReceiptId = null"
      @changed="load"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { format } from 'date-fns'
import { useVendorsStore } from '@/stores/vendors'
import { categoryLabel } from '@/constants/expenseCategories'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import type { VendorDetail } from '@/types'
import VendorFormModal from '@/components/VendorFormModal.vue'
import ExpenseFormModal from '@/components/ExpenseFormModal.vue'
import RecurringExpenseFormModal from '@/components/RecurringExpenseFormModal.vue'
import ReceiptUploadModal from '@/components/ReceiptUploadModal.vue'
import ReceiptDetailModal from '@/components/ReceiptDetailModal.vue'

const route = useRoute()
const store = useVendorsStore()

const vendor = ref<VendorDetail | null>(null)
const loading = ref(true)
const error = ref('')
const showEdit = ref(false)
const showExpenseForm = ref(false)
const showRecurringForm = ref(false)
const showReceiptUpload = ref(false)
const activeReceiptId = ref<string | null>(null)

const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function formatDate(date: string): string {
  return format(toLondonFakeLocalDate(date), 'dd MMM yyyy')
}
function fileIcon(fileType: string): string {
  return fileType === 'application/pdf' ? 'fas fa-file-pdf' : 'fas fa-file-image'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    vendor.value = await store.getVendor(route.params.id as string)
  } catch (err: any) {
    error.value = err?.response?.data?.error || err?.message || 'Failed to load vendor'
  } finally {
    loading.value = false
  }
}

function onVendorSaved() {
  showEdit.value = false
  load()
}

// A new expense/recurring template/receipt was added against this vendor — close
// the form and refresh so it shows up in the lists + totals below. (A recurring
// template backfills real expenses, which then appear in the Expenses table.)
function onChildSaved() {
  showExpenseForm.value = false
  showRecurringForm.value = false
  showReceiptUpload.value = false
  load()
}

watch(() => route.params.id, load)
onMounted(load)
</script>
