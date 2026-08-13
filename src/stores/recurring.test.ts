import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecurringStore } from './recurring'
import { apiService } from '@/services/api'
import type { RecurringExpense } from '@/types'

vi.mock('@/services/api', () => ({
  apiService: {
    getRecurringExpenses: vi.fn(),
    createRecurringExpense: vi.fn(),
    updateRecurringExpense: vi.fn(),
    deleteRecurringExpense: vi.fn(),
    generateRecurringExpenses: vi.fn(),
  },
}))

const mockRecurring: RecurringExpense = {
  id: 'rec1',
  description: 'Phone bill',
  category: 'PHONE_ADMIN',
  amount: 3500,
  dayOfMonth: 15,
  vendorId: 'v1',
  vendor: { id: 'v1', name: 'EE' },
  notes: null,
  active: true,
  startDate: '2026-06-01T00:00:00.000Z',
  endDate: null,
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  missingMonths: [
    { year: 2026, month: 6, label: 'Jun 2026', date: '2026-06-15T00:00:00.000Z' },
    { year: 2026, month: 7, label: 'Jul 2026', date: '2026-07-15T00:00:00.000Z' },
  ],
}

describe('recurring store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches recurring expenses and stores them', async () => {
    vi.mocked(apiService.getRecurringExpenses).mockResolvedValue([mockRecurring])
    const store = useRecurringStore()

    await store.fetchRecurring()

    expect(store.recurring).toEqual([mockRecurring])
    expect(store.error).toBeNull()
  })

  it('records an error when fetching fails', async () => {
    vi.mocked(apiService.getRecurringExpenses).mockRejectedValue(new Error('network down'))
    const store = useRecurringStore()

    await store.fetchRecurring()

    expect(store.error).toBe('network down')
    expect(store.recurring).toEqual([])
  })

  it('creates a recurring expense and refreshes the list', async () => {
    vi.mocked(apiService.createRecurringExpense).mockResolvedValue(mockRecurring)
    vi.mocked(apiService.getRecurringExpenses).mockResolvedValue([mockRecurring])
    const store = useRecurringStore()

    const payload = { description: 'Phone bill', category: 'PHONE_ADMIN' as const, amount: 3500, startDate: '2026-06-01T00:00:00.000Z' }
    const created = await store.createRecurring(payload)

    expect(apiService.createRecurringExpense).toHaveBeenCalledWith(payload)
    expect(created).toEqual(mockRecurring)
    expect(store.recurring).toEqual([mockRecurring])
  })

  it('generates missing months and refreshes the list', async () => {
    vi.mocked(apiService.generateRecurringExpenses).mockResolvedValue({ created: [{ id: 'e1' } as any] })
    vi.mocked(apiService.getRecurringExpenses).mockResolvedValue([{ ...mockRecurring, missingMonths: [] }])
    const store = useRecurringStore()

    const created = await store.generate('rec1', { all: true })

    expect(apiService.generateRecurringExpenses).toHaveBeenCalledWith('rec1', { all: true })
    expect(created).toHaveLength(1)
    expect(store.recurring[0].missingMonths).toEqual([])
  })

  it('removes a deleted recurring expense from local state without refetching', async () => {
    vi.mocked(apiService.deleteRecurringExpense).mockResolvedValue(undefined)
    const store = useRecurringStore()
    store.recurring = [mockRecurring]

    await store.deleteRecurring('rec1')

    expect(apiService.deleteRecurringExpense).toHaveBeenCalledWith('rec1')
    expect(store.recurring).toEqual([])
  })
})
