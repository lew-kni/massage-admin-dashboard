import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ReceiptDetailModal from './ReceiptDetailModal.vue'
import { apiService } from '@/services/api'
import type { ReceiptDetail, Expense } from '@/types'

vi.mock('@/services/api', () => ({
  apiService: {
    getReceipt: vi.fn(),
    getReceiptFileUrl: vi.fn(),
    getReceipts: vi.fn().mockResolvedValue([]),
    linkExpenseToReceipt: vi.fn(),
    unlinkExpenseFromReceipt: vi.fn(),
    getExpenses: vi.fn(),
    getExpense: vi.fn(),
    createExpenseUnderReceipt: vi.fn(),
  },
}))

const detail: ReceiptDetail = {
  id: 'r1',
  vendorId: 'v1',
  vendor: { id: 'v1', name: 'B&Q' },
  date: '2026-07-01T00:00:00.000Z',
  totalAmount: 3000,
  notes: null,
  fileName: 'receipt.jpg',
  fileType: 'image/jpeg',
  fileSize: 1000,
  filePath: 'receipts/abc.jpg',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  expenseCount: 1,
  loggedTotal: 1000,
  expenses: [
    { id: 'e1', date: '2026-07-01T00:00:00.000Z', category: 'SUPPLIES', description: 'Screws', amount: 1000 },
  ],
}

const unlinkedExpense: Expense = {
  id: 'e2', date: '2026-07-02T00:00:00.000Z', amount: 500, category: 'SUPPLIES',
  description: 'Sandpaper', vendorId: 'v1', vendor: { id: 'v1', name: 'B&Q' }, notes: null, createdAt: '', updatedAt: '',
}

// Belongs to a different vendor than the receipt (v1) — must not be attachable.
const otherVendorExpense: Expense = {
  id: 'e3', date: '2026-07-03T00:00:00.000Z', amount: 700, category: 'SUPPLIES',
  description: 'Paintbrush', vendorId: 'v2', vendor: { id: 'v2', name: 'Screwfix' }, notes: null, createdAt: '', updatedAt: '',
}

describe('ReceiptDetailModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(apiService.getReceipt).mockResolvedValue(detail)
    vi.mocked(apiService.getReceipts).mockResolvedValue([])
    vi.mocked(apiService.getExpenses).mockResolvedValue([unlinkedExpense, otherVendorExpense])
  })

  it('shows the running total against the receipt total', async () => {
    const wrapper = mount(ReceiptDetailModal, { props: { receiptId: 'r1' } })
    await flushPromises()

    expect(wrapper.text()).toContain('£10.00 of £30.00 logged')
    expect(wrapper.text()).toContain('£20.00 left to log')
  })

  it('lists the linked expense', async () => {
    const wrapper = mount(ReceiptDetailModal, { props: { receiptId: 'r1' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Screws')
  })

  it('attaching an existing expense calls the link API and refreshes', async () => {
    vi.mocked(apiService.linkExpenseToReceipt).mockResolvedValue(undefined)
    vi.mocked(apiService.getReceipt).mockResolvedValueOnce(detail).mockResolvedValueOnce({
      ...detail,
      loggedTotal: 1500,
      expenses: [...detail.expenses, { id: 'e2', date: '2026-07-02T00:00:00.000Z', category: 'SUPPLIES', description: 'Sandpaper', amount: 500 }],
    })

    const wrapper = mount(ReceiptDetailModal, { props: { receiptId: 'r1' } })
    await flushPromises()

    const attachButton = wrapper.findAll('button').find((b) => b.text().includes('Attach existing'))
    expect(attachButton).toBeDefined()
    await attachButton!.trigger('click')
    await flushPromises()

    const item = wrapper.findAll('li').find((li) => li.text().includes('Sandpaper'))
    expect(item).toBeDefined()
    await item!.trigger('click')
    await flushPromises()

    expect(apiService.linkExpenseToReceipt).toHaveBeenCalledWith('r1', 'e2')
  })

  it('only offers expenses belonging to the receipt vendor', async () => {
    const wrapper = mount(ReceiptDetailModal, { props: { receiptId: 'r1' } })
    await flushPromises()

    const attachButton = wrapper.findAll('button').find((b) => b.text().includes('Attach existing'))
    await attachButton!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Sandpaper')
    expect(wrapper.text()).not.toContain('Paintbrush')
  })

  it('unlinking an expense calls the unlink API', async () => {
    vi.mocked(apiService.unlinkExpenseFromReceipt).mockResolvedValue(undefined)
    vi.mocked(apiService.getReceipt).mockResolvedValueOnce(detail).mockResolvedValueOnce({
      ...detail, loggedTotal: 0, expenseCount: 0, expenses: [],
    })

    const wrapper = mount(ReceiptDetailModal, { props: { receiptId: 'r1' } })
    await flushPromises()

    const expenseRow = wrapper.findAll('li').find((li) => li.text().includes('Screws'))
    expect(expenseRow).toBeDefined()
    await expenseRow!.find('button').trigger('click')
    await flushPromises()

    expect(apiService.unlinkExpenseFromReceipt).toHaveBeenCalledWith('r1', 'e1')
  })
})
