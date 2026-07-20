import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ExpenseFormModal from './ExpenseFormModal.vue'
import { useExpensesStore } from '@/stores/expenses'
import { apiService } from '@/services/api'

vi.mock('@/services/api', () => ({
  apiService: {
    getExpenses: vi.fn().mockResolvedValue([]),
    createExpense: vi.fn(),
    updateExpense: vi.fn(),
    deleteExpense: vi.fn(),
  },
}))

describe('ExpenseFormModal — mileage flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('shows the Amount field by default and no Miles field', () => {
    const wrapper = mount(ExpenseFormModal)
    expect(wrapper.text()).toContain('Amount (£)')
    expect(wrapper.text()).not.toContain('Miles driven')
  })

  it('switches to a Miles field with a live estimate when Mileage is selected', async () => {
    const wrapper = mount(ExpenseFormModal)

    await wrapper.find('select').setValue('MILEAGE')

    expect(wrapper.text()).toContain('Miles driven')
    expect(wrapper.text()).not.toContain('Amount (£)')

    const milesInput = wrapper.find('input[type="number"]')
    await milesInput.setValue('40')

    // 40 miles at the standard 45p rate with nothing else logged this tax year = £18.00
    expect(wrapper.text()).toContain('£18.00')
  })

  it('accounts for mileage already logged this tax year in the live estimate', async () => {
    const store = useExpensesStore()
    store.expenses = [
      {
        id: 'existing',
        date: '2026-05-01T00:00:00.000Z',
        amount: 9900 * 45,
        category: 'MILEAGE',
        description: 'Earlier trip',
        vendor: null,
        notes: null,
        miles: 9900,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    ]

    const wrapper = mount(ExpenseFormModal)
    await wrapper.find('select').setValue('MILEAGE')
    await wrapper.find('input[type="date"]').setValue('2026-06-01')
    await wrapper.find('input[type="number"]').setValue('300')

    // 9,900 already logged; 300 more splits 100 @ 45p + 200 @ 25p = £95.00
    expect(wrapper.text()).toContain('£95.00')
    expect(wrapper.text()).toContain('100 mi @ 45p')
    expect(wrapper.text()).toContain('200 mi @ 25p')
  })

  it('submits a mileage entry with miles and no amount field', async () => {
    vi.mocked(apiService.createExpense).mockResolvedValue({
      id: 'new',
      date: '2026-07-01T00:00:00.000Z',
      amount: 1800,
      category: 'MILEAGE',
      description: 'Trip to client',
      vendor: null,
      notes: null,
      miles: 40,
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
    })
    vi.mocked(apiService.getExpenses).mockResolvedValue([])

    const wrapper = mount(ExpenseFormModal)
    await wrapper.find('select').setValue('MILEAGE')
    await wrapper.find('input[type="number"]').setValue('40')
    await wrapper.find('input[type="text"]').setValue('Trip to client')

    await wrapper.find('form').trigger('submit.prevent')
    await Promise.resolve()

    expect(apiService.createExpense).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'MILEAGE', miles: 40, description: 'Trip to client' })
    )
    const payload = vi.mocked(apiService.createExpense).mock.calls[0][0] as Record<string, unknown>
    expect(payload.amount).toBeUndefined()
  })

  it('requires miles to be entered before submitting a mileage expense', async () => {
    const wrapper = mount(ExpenseFormModal)
    await wrapper.find('select').setValue('MILEAGE')
    await wrapper.find('input[type="text"]').setValue('Trip to client')

    await wrapper.find('form').trigger('submit.prevent')
    await Promise.resolve()

    expect(apiService.createExpense).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Enter the number of miles driven')
  })
})
