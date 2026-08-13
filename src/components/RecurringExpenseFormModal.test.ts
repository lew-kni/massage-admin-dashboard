import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import RecurringExpenseFormModal from './RecurringExpenseFormModal.vue'
import { apiService } from '@/services/api'

vi.mock('@/services/api', () => ({
  apiService: {
    getVendors: vi.fn().mockResolvedValue([]),
    createVendor: vi.fn(),
    getRecurringExpenses: vi.fn().mockResolvedValue([]),
    createRecurringExpense: vi.fn().mockResolvedValue({}),
    updateRecurringExpense: vi.fn().mockResolvedValue({}),
  },
}))

describe('RecurringExpenseFormModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('excludes Mileage from the category options', () => {
    const wrapper = mount(RecurringExpenseFormModal)
    const options = wrapper.findAll('select option').map((o) => o.text())
    expect(options).not.toContain('Mileage (car)')
    expect(options).toContain('Phone, software & admin')
  })

  it('renders the vendor picker (regression: VendorSelect must be imported)', async () => {
    const wrapper = mount(RecurringExpenseFormModal)
    await flushPromises()
    expect(wrapper.find('input[placeholder="e.g. EE, Vodafone"]').exists()).toBe(true)
  })

  it('emits switch-mode when the Single tab is clicked with modeTabs on', async () => {
    const wrapper = mount(RecurringExpenseFormModal, { props: { modeTabs: true } })
    await flushPromises()
    const singleTab = wrapper.findAll('button').find((b) => b.text().includes('Single'))
    expect(singleTab).toBeDefined()
    await singleTab!.trigger('click')
    expect(wrapper.emitted('switch-mode')).toBeTruthy()
  })

  it('submits a template with amount in pence and a first-of-month startDate', async () => {
    const wrapper = mount(RecurringExpenseFormModal)
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('Phone bill')
    await wrapper.find('input[type="number"][step="0.01"]').setValue('35.00')
    await wrapper.find('input[type="month"]').setValue('2026-06')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiService.createRecurringExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Phone bill',
        category: 'PHONE_ADMIN',
        amount: 3500,
        startDate: '2026-06-01T00:00:00.000Z',
      })
    )
  })

  it('blocks submit when the amount is empty', async () => {
    const wrapper = mount(RecurringExpenseFormModal)
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('Phone bill')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(apiService.createRecurringExpense).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('usual amount greater than £0')
  })
})
