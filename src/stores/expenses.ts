import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiService } from '@/services/api'
import type { Expense } from '@/types'

export const useExpensesStore = defineStore('expenses', () => {
  const expenses = ref<Expense[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchExpenses() {
    loading.value = true
    error.value = null
    try {
      expenses.value = await apiService.getExpenses()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch expenses'
    } finally {
      loading.value = false
    }
  }

  async function createExpense(payload: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    const created = await apiService.createExpense(payload)
    await fetchExpenses()
    return created
  }

  async function updateExpense(id: string, payload: Partial<Expense>) {
    const updated = await apiService.updateExpense(id, payload)
    await fetchExpenses()
    return updated
  }

  async function deleteExpense(id: string) {
    await apiService.deleteExpense(id)
    expenses.value = expenses.value.filter((e) => e.id !== id)
  }

  return {
    expenses,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  }
})
