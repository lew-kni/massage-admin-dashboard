import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExpensesStore } from './expenses'
import { apiService } from '@/services/api'
import type { Expense } from '@/types'

vi.mock('@/services/api', () => ({
  apiService: {
    getExpenses: vi.fn(),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  },
}))

const mockExpense: Expense = {
  id: 'e1',
  date: '2026-07-01T00:00:00.000Z',
  amount: 1299,
  category: 'SUPPLIES',
  description: 'Massage oil',
  vendor: 'Amazon',
  notes: null,
  miles: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
}

describe('expenses store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches expenses and stores them', async () => {
    vi.mocked(apiService.getExpenses).mockResolvedValue([mockExpense])
    const store = useExpensesStore()

    await store.fetchExpenses()

    expect(store.expenses).toEqual([mockExpense])
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('records an error message when fetching fails', async () => {
    vi.mocked(apiService.getExpenses).mockRejectedValue(new Error('network down'))
    const store = useExpensesStore()

    await store.fetchExpenses()

    expect(store.error).toBe('network down')
    expect(store.expenses).toEqual([])
  })

  it('creates an expense and refreshes the list', async () => {
    vi.mocked(apiService.createExpense).mockResolvedValue(mockExpense)
    vi.mocked(apiService.getExpenses).mockResolvedValue([mockExpense])
    const store = useExpensesStore()

    const { id, createdAt, updatedAt, ...payload } = mockExpense
    const created = await store.createExpense(payload)

    expect(apiService.createExpense).toHaveBeenCalledWith(payload)
    expect(created).toEqual(mockExpense)
    expect(store.expenses).toEqual([mockExpense]) // refetched after create
  })

  it('updates an expense and refreshes the list', async () => {
    const updated = { ...mockExpense, amount: 1500 }
    vi.mocked(apiService.updateExpense).mockResolvedValue(updated)
    vi.mocked(apiService.getExpenses).mockResolvedValue([updated])
    const store = useExpensesStore()

    await store.updateExpense('e1', { amount: 1500 })

    expect(apiService.updateExpense).toHaveBeenCalledWith('e1', { amount: 1500 })
    expect(store.expenses).toEqual([updated])
  })

  it('removes a deleted expense from local state without refetching', async () => {
    vi.mocked(apiService.deleteExpense).mockResolvedValue(undefined)
    const store = useExpensesStore()
    store.expenses = [mockExpense]

    await store.deleteExpense('e1')

    expect(apiService.deleteExpense).toHaveBeenCalledWith('e1')
    expect(store.expenses).toEqual([])
  })
})
