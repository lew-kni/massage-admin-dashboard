<template>
  <div class="p-8 dark:text-gray-50">
    <div class="flex flex-wrap justify-between items-start gap-4 mb-8">
      <div>
        <h1>Receipts</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-2">Upload a receipt, then log the expenses it covers — one receipt can back several expenses, or none yet.</p>
      </div>
      <button @click="showUpload = true" class="btn-primary text-sm">
        <i class="fas fa-upload mr-1"></i>Upload receipt
      </button>
    </div>

    <div v-if="store.loading && store.receipts.length === 0" class="card p-8 text-center text-gray-500">
      Loading…
    </div>

    <div v-else-if="store.receipts.length === 0" class="card p-8 text-center text-gray-500">
      <i class="fas fa-receipt text-2xl mb-2"></i>
      <p>No receipts uploaded yet.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="r in sortedReceipts"
        :key="r.id"
        class="card p-4 cursor-pointer hover:ring-2 hover:ring-sage-500 transition-all"
        @click="openDetail(r.id)"
      >
        <div class="flex justify-between items-start mb-2">
          <p class="font-medium">{{ r.vendor || 'Receipt' }}</p>
          <button @click.stop="confirmDelete(r)" class="text-gray-300 hover:text-red-600 text-sm"><i class="fas fa-trash"></i></button>
        </div>
        <p class="text-xs text-gray-500 mb-3">{{ r.date ? formatDate(r.date) : 'No date' }} · <i :class="fileIcon(r.fileType)"></i> {{ r.fileName }}</p>

        <div v-if="r.totalAmount != null" class="mb-1">
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-600 dark:text-gray-300">{{ gbp(r.loggedTotal / 100) }} of {{ gbp(r.totalAmount / 100) }}</span>
            <span class="text-gray-400">{{ r.expenseCount }} expense{{ r.expenseCount === 1 ? '' : 's' }}</span>
          </div>
          <div class="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              class="h-full rounded-full"
              :class="r.loggedTotal > r.totalAmount ? 'bg-amber-500' : 'bg-sage-500'"
              :style="{ width: `${Math.min(100, pct(r.loggedTotal, r.totalAmount))}%` }"
            ></div>
          </div>
        </div>
        <p v-else class="text-xs text-gray-500">{{ gbp(r.loggedTotal / 100) }} logged · {{ r.expenseCount }} expense{{ r.expenseCount === 1 ? '' : 's' }}</p>
      </div>
    </div>

    <p v-if="store.error" class="mt-4 text-sm text-red-700">{{ store.error }}</p>

    <ReceiptUploadModal v-if="showUpload" @close="showUpload = false" @saved="showUpload = false" />
    <ReceiptDetailModal
      v-if="activeReceiptId"
      :receipt-id="activeReceiptId"
      @close="activeReceiptId = null"
      @changed="store.fetchReceipts()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { useReceiptsStore } from '@/stores/receipts'
import { toLondonFakeLocalDate } from '@/utils/formatLondon'
import type { Receipt } from '@/types'
import ReceiptUploadModal from '@/components/ReceiptUploadModal.vue'
import ReceiptDetailModal from '@/components/ReceiptDetailModal.vue'

const store = useReceiptsStore()
const showUpload = ref(false)
const activeReceiptId = ref<string | null>(null)

const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)
function formatDate(date: string): string {
  return format(toLondonFakeLocalDate(date), 'dd MMM yyyy')
}
function fileIcon(fileType: string): string {
  return fileType === 'application/pdf' ? 'fas fa-file-pdf' : 'fas fa-file-image'
}

const sortedReceipts = computed(() =>
  [...store.receipts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
)

function openDetail(id: string) {
  activeReceiptId.value = id
}

async function confirmDelete(r: Receipt) {
  if (!confirm(`Delete this receipt (${r.vendor || r.fileName})? Expenses logged against it are kept, just unlinked.`)) return
  await store.deleteReceipt(r.id)
}

onMounted(() => {
  if (store.receipts.length === 0) store.fetchReceipts()
})
</script>
