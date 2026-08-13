import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import VendorSelect from './VendorSelect.vue'
import { apiService } from '@/services/api'
import type { Vendor } from '@/types'

vi.mock('@/services/api', () => ({
  apiService: {
    getVendors: vi.fn(),
    createVendor: vi.fn(),
  },
}))

function vendor(id: string, name: string): Vendor {
  return {
    id, name, notes: null, defaultCategory: null,
    createdAt: '', updatedAt: '', expenseCount: 0, receiptCount: 0, totalSpent: 0,
  }
}

describe('VendorSelect', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(apiService.getVendors).mockResolvedValue([vendor('v1', 'Amazon'), vendor('v2', 'Screwfix')])
  })

  it('lists existing vendors and selects one on click', async () => {
    const wrapper = mount(VendorSelect)
    await flushPromises()

    await wrapper.find('input').trigger('focus')
    const option = wrapper.findAll('li').find((li) => li.text() === 'Amazon' || li.text().startsWith('Amazon'))
    expect(option).toBeDefined()
    await option!.trigger('mousedown')

    const modelEvents = wrapper.emitted('update:modelValue') || []
    expect(modelEvents[modelEvents.length - 1]).toEqual(['v1'])
    const selectedEvents = wrapper.emitted('vendor-selected') || []
    const selected = selectedEvents[selectedEvents.length - 1][0] as Vendor
    expect(selected.name).toBe('Amazon')
  })

  it('filters the list as you type', async () => {
    const wrapper = mount(VendorSelect)
    await flushPromises()

    const input = wrapper.find('input')
    await input.setValue('screw')
    await input.trigger('input')

    const names = wrapper.findAll('li').map((li) => li.text())
    expect(names.some((n) => n.includes('Screwfix'))).toBe(true)
    expect(names.some((n) => n.includes('Amazon'))).toBe(false)
  })

  it('offers to create a vendor for an unknown name and selects the new one', async () => {
    vi.mocked(apiService.createVendor).mockResolvedValue(vendor('v3', 'B&Q'))
    // fetchVendors is called again after create — return the fuller list.
    vi.mocked(apiService.getVendors)
      .mockResolvedValueOnce([vendor('v1', 'Amazon'), vendor('v2', 'Screwfix')])
      .mockResolvedValueOnce([vendor('v1', 'Amazon'), vendor('v2', 'Screwfix'), vendor('v3', 'B&Q')])

    const wrapper = mount(VendorSelect)
    await flushPromises()

    const input = wrapper.find('input')
    await input.setValue('B&Q')
    await input.trigger('input')

    const addOption = wrapper.findAll('li').find((li) => li.text().includes('Add "B&Q"'))
    expect(addOption).toBeDefined()
    await addOption!.trigger('mousedown')
    await flushPromises()

    expect(apiService.createVendor).toHaveBeenCalledWith({ name: 'B&Q' })
    const modelEvents = wrapper.emitted('update:modelValue') || []
    expect(modelEvents[modelEvents.length - 1]).toEqual(['v3'])
  })
})
