import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Receipt, ReceiptDetail, Expense } from '@/types'

export const useReceiptsStore = defineStore('receipts', () => {
  const receipts = ref<Receipt[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchReceipts() {
    loading.value = true
    error.value = null
    try {
      receipts.value = await apiService.getReceipts()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch receipts'
    } finally {
      loading.value = false
    }
  }

  async function getReceipt(id: string): Promise<ReceiptDetail> {
    return apiService.getReceipt(id)
  }

  async function getFileUrl(id: string): Promise<string> {
    const { url } = await apiService.getReceiptFileUrl(id)
    return url
  }

  async function createReceipt(payload: {
    file: File
    vendor?: string | null
    date?: string | null
    totalAmount?: number | null
    notes?: string | null
  }) {
    const created = await apiService.createReceipt(payload)
    await fetchReceipts()
    return created
  }

  async function updateReceipt(id: string, payload: Partial<Receipt>) {
    const updated = await apiService.updateReceipt(id, payload)
    await fetchReceipts()
    return updated
  }

  async function deleteReceipt(id: string) {
    await apiService.deleteReceipt(id)
    receipts.value = receipts.value.filter((r) => r.id !== id)
  }

  async function createExpenseUnderReceipt(
    receiptId: string,
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    const created = await apiService.createExpenseUnderReceipt(receiptId, expense)
    await fetchReceipts()
    return created
  }

  async function linkExpense(receiptId: string, expenseId: string) {
    await apiService.linkExpenseToReceipt(receiptId, expenseId)
    await fetchReceipts()
  }

  async function unlinkExpense(receiptId: string, expenseId: string) {
    await apiService.unlinkExpenseFromReceipt(receiptId, expenseId)
    await fetchReceipts()
  }

  return {
    receipts,
    loading,
    error,
    fetchReceipts,
    getReceipt,
    getFileUrl,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    createExpenseUnderReceipt,
    linkExpense,
    unlinkExpense,
  }
})
