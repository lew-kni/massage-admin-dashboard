import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useReceiptsStore } from './receipts'
import { apiService } from '@/services/api'
import type { Receipt, ReceiptDetail } from '@/types'

vi.mock('@/services/api', () => ({
  apiService: {
    getReceipts: vi.fn(),
    getReceipt: vi.fn(),
    getReceiptFileUrl: vi.fn(),
    createReceipt: vi.fn(),
    updateReceipt: vi.fn(),
    deleteReceipt: vi.fn(),
    createExpenseUnderReceipt: vi.fn(),
    linkExpenseToReceipt: vi.fn(),
    unlinkExpenseFromReceipt: vi.fn(),
  },
}))

const mockReceipt: Receipt = {
  id: 'r1',
  vendor: 'Screwfix',
  date: '2026-07-01T00:00:00.000Z',
  totalAmount: 3000,
  notes: null,
  fileName: 'receipt.jpg',
  fileType: 'image/jpeg',
  fileSize: 12345,
  filePath: 'receipts/abc.jpg',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  expenseCount: 0,
  loggedTotal: 0,
}

describe('receipts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches receipts and stores them', async () => {
    vi.mocked(apiService.getReceipts).mockResolvedValue([mockReceipt])
    const store = useReceiptsStore()

    await store.fetchReceipts()

    expect(store.receipts).toEqual([mockReceipt])
    expect(store.error).toBeNull()
  })

  it('records an error message when fetching fails', async () => {
    vi.mocked(apiService.getReceipts).mockRejectedValue(new Error('network down'))
    const store = useReceiptsStore()

    await store.fetchReceipts()

    expect(store.error).toBe('network down')
  })

  it('uploads a receipt via FormData and refreshes the list', async () => {
    vi.mocked(apiService.createReceipt).mockResolvedValue(mockReceipt)
    vi.mocked(apiService.getReceipts).mockResolvedValue([mockReceipt])
    const store = useReceiptsStore()

    const file = new File(['bytes'], 'receipt.jpg', { type: 'image/jpeg' })
    await store.createReceipt({ file, vendor: 'Screwfix', date: null, totalAmount: 3000, notes: null })

    expect(apiService.createReceipt).toHaveBeenCalledWith({
      file, vendor: 'Screwfix', date: null, totalAmount: 3000, notes: null,
    })
    expect(store.receipts).toEqual([mockReceipt])
  })

  it('deletes a receipt from local state without refetching', async () => {
    vi.mocked(apiService.deleteReceipt).mockResolvedValue(undefined)
    const store = useReceiptsStore()
    store.receipts = [mockReceipt]

    await store.deleteReceipt('r1')

    expect(apiService.deleteReceipt).toHaveBeenCalledWith('r1')
    expect(store.receipts).toEqual([])
  })

  it('creates an expense under a receipt and refreshes the receipt list', async () => {
    vi.mocked(apiService.createExpenseUnderReceipt).mockResolvedValue({
      id: 'e1', date: '2026-07-01T00:00:00.000Z', amount: 500, category: 'SUPPLIES',
      description: 'Oils', vendor: null, notes: null, createdAt: '', updatedAt: '',
    })
    vi.mocked(apiService.getReceipts).mockResolvedValue([{ ...mockReceipt, expenseCount: 1, loggedTotal: 500 }])
    const store = useReceiptsStore()

    await store.createExpenseUnderReceipt('r1', {
      date: '2026-07-01', amount: 500, category: 'SUPPLIES', description: 'Oils',
    } as any)

    expect(apiService.createExpenseUnderReceipt).toHaveBeenCalledWith('r1', expect.objectContaining({ description: 'Oils' }))
    expect(store.receipts[0].loggedTotal).toBe(500)
  })

  it('links an expense to a receipt and refreshes', async () => {
    vi.mocked(apiService.linkExpenseToReceipt).mockResolvedValue(undefined)
    vi.mocked(apiService.getReceipts).mockResolvedValue([{ ...mockReceipt, expenseCount: 1 }])
    const store = useReceiptsStore()

    await store.linkExpense('r1', 'e1')

    expect(apiService.linkExpenseToReceipt).toHaveBeenCalledWith('r1', 'e1')
    expect(store.receipts[0].expenseCount).toBe(1)
  })

  it('unlinks an expense from a receipt and refreshes', async () => {
    vi.mocked(apiService.unlinkExpenseFromReceipt).mockResolvedValue(undefined)
    vi.mocked(apiService.getReceipts).mockResolvedValue([{ ...mockReceipt, expenseCount: 0 }])
    const store = useReceiptsStore()

    await store.unlinkExpense('r1', 'e1')

    expect(apiService.unlinkExpenseFromReceipt).toHaveBeenCalledWith('r1', 'e1')
  })

  it('fetches a single receipt detail without touching the list', async () => {
    const detail: ReceiptDetail = { ...mockReceipt, expenses: [] }
    vi.mocked(apiService.getReceipt).mockResolvedValue(detail)
    const store = useReceiptsStore()

    const result = await store.getReceipt('r1')

    expect(result).toEqual(detail)
    expect(store.receipts).toEqual([]) // unaffected
  })
})
