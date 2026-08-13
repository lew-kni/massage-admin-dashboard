import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVendorsStore } from './vendors'
import { apiService } from '@/services/api'
import type { Vendor, VendorDetail } from '@/types'

vi.mock('@/services/api', () => ({
  apiService: {
    getVendors: vi.fn(),
    getVendor: vi.fn(),
    createVendor: vi.fn(),
    updateVendor: vi.fn(),
    deleteVendor: vi.fn(),
  },
}))

const mockVendor: Vendor = {
  id: 'v1',
  name: 'Screwfix',
  notes: null,
  defaultCategory: 'SUPPLIES',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  expenseCount: 2,
  receiptCount: 1,
  totalSpent: 2000,
}

describe('vendors store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches vendors and stores them', async () => {
    vi.mocked(apiService.getVendors).mockResolvedValue([mockVendor])
    const store = useVendorsStore()

    await store.fetchVendors()

    expect(store.vendors).toEqual([mockVendor])
    expect(store.error).toBeNull()
  })

  it('records an error when fetching fails', async () => {
    vi.mocked(apiService.getVendors).mockRejectedValue(new Error('network down'))
    const store = useVendorsStore()

    await store.fetchVendors()

    expect(store.error).toBe('network down')
    expect(store.vendors).toEqual([])
  })

  it('creates a vendor and refreshes the list', async () => {
    vi.mocked(apiService.createVendor).mockResolvedValue(mockVendor)
    vi.mocked(apiService.getVendors).mockResolvedValue([mockVendor])
    const store = useVendorsStore()

    const created = await store.createVendor({ name: 'Screwfix', defaultCategory: 'SUPPLIES' })

    expect(apiService.createVendor).toHaveBeenCalledWith({ name: 'Screwfix', defaultCategory: 'SUPPLIES' })
    expect(created).toEqual(mockVendor)
    expect(store.vendors).toEqual([mockVendor])
  })

  it('updates a vendor and refreshes the list', async () => {
    const updated = { ...mockVendor, name: 'Screwfix Glossop' }
    vi.mocked(apiService.updateVendor).mockResolvedValue(updated)
    vi.mocked(apiService.getVendors).mockResolvedValue([updated])
    const store = useVendorsStore()

    await store.updateVendor('v1', { name: 'Screwfix Glossop' })

    expect(apiService.updateVendor).toHaveBeenCalledWith('v1', { name: 'Screwfix Glossop' })
    expect(store.vendors).toEqual([updated])
  })

  it('removes a deleted vendor from local state without refetching', async () => {
    vi.mocked(apiService.deleteVendor).mockResolvedValue(undefined)
    const store = useVendorsStore()
    store.vendors = [mockVendor]

    await store.deleteVendor('v1')

    expect(apiService.deleteVendor).toHaveBeenCalledWith('v1')
    expect(store.vendors).toEqual([])
  })

  it('fetches a single vendor detail without touching the list', async () => {
    const detail: VendorDetail = { ...mockVendor, expenses: [], receipts: [] }
    vi.mocked(apiService.getVendor).mockResolvedValue(detail)
    const store = useVendorsStore()

    const result = await store.getVendor('v1')

    expect(result).toEqual(detail)
    expect(store.vendors).toEqual([])
  })
})
