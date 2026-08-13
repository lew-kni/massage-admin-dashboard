import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { RecurringExpense, MonthRef, Expense } from '@/types'

export const useRecurringStore = defineStore('recurring', () => {
  const recurring = ref<RecurringExpense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRecurring() {
    loading.value = true
    error.value = null
    try {
      recurring.value = await apiService.getRecurringExpenses()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recurring expenses'
    } finally {
      loading.value = false
    }
  }

  async function createRecurring(
    payload: Partial<RecurringExpense> & { description: string; category: string; amount: number; startDate: string }
  ) {
    const created = await apiService.createRecurringExpense(payload)
    await fetchRecurring()
    return created
  }

  async function updateRecurring(id: string, payload: Partial<RecurringExpense>) {
    const updated = await apiService.updateRecurringExpense(id, payload)
    await fetchRecurring()
    return updated
  }

  async function deleteRecurring(id: string) {
    await apiService.deleteRecurringExpense(id)
    recurring.value = recurring.value.filter((r) => r.id !== id)
  }

  async function generate(id: string, body: { all: true } | { months: Pick<MonthRef, 'year' | 'month'>[] }) {
    const result = await apiService.generateRecurringExpenses(id, body)
    await fetchRecurring()
    return result.created as Expense[]
  }

  return {
    recurring,
    loading,
    error,
    fetchRecurring,
    createRecurring,
    updateRecurring,
    deleteRecurring,
    generate,
  }
})
