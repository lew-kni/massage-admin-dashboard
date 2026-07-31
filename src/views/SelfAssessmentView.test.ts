import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SelfAssessmentView from './SelfAssessmentView.vue'
import { apiService } from '@/services/api'
import type { Expense } from '@/types'

vi.mock('@/services/api', () => ({
  apiService: {
    getBookings: vi.fn().mockResolvedValue([]),
    getExpenses: vi.fn(),
  },
}))

// The real North Peak Massage 2026/27 expenses, exactly as logged in the admin
// panel (amounts in pence, categories as stored). Total = £211.52.
const expense = (over: Partial<Expense>): Expense => ({
  id: Math.random().toString(36).slice(2),
  date: '2026-07-01T00:00:00.000Z',
  amount: 0,
  category: 'OTHER',
  description: '',
  vendor: null,
  notes: null,
  createdAt: '',
  updatedAt: '',
  receiptCount: 1,
  ...over,
})

const NORTH_PEAK_EXPENSES: Expense[] = [
  expense({ amount: 5200, category: 'INSURANCE_MEMBERSHIP', description: 'ICO Registration', date: '2026-07-25T00:00:00.000Z' }),
  expense({ amount: 3500, category: 'INSURANCE_MEMBERSHIP', description: 'STA Student Membership', date: '2026-07-22T00:00:00.000Z' }),
  expense({ amount: 1999, category: 'SUPPLIES', description: 'Towels', date: '2026-07-21T00:00:00.000Z' }),
  expense({ amount: 605, category: 'MARKETING', description: 'Emails', date: '2026-07-19T00:00:00.000Z' }),
  expense({ amount: 1800, category: 'MARKETING', description: 'Claude', date: '2026-07-19T00:00:00.000Z' }),
  expense({ amount: 2536, category: 'MARKETING', description: 'Domains', date: '2026-07-18T00:00:00.000Z' }),
  expense({ amount: 200, category: 'SUPPLIES', description: 'Zoflora Spray', date: '2026-06-30T00:00:00.000Z' }),
  expense({ amount: 170, category: 'SUPPLIES', description: 'Cleaning Cloths', date: '2026-06-30T00:00:00.000Z' }),
  expense({ amount: 2999, category: 'SUPPLIES', description: 'Towels', date: '2026-06-30T00:00:00.000Z' }),
  expense({ amount: 1497, category: 'SUPPLIES', description: 'Massage Oil', date: '2026-06-26T00:00:00.000Z' }),
  expense({ amount: 249, category: 'SUPPLIES', description: 'Massage Oil Bottle', date: '2026-06-26T00:00:00.000Z' }),
  expense({ amount: 397, category: 'OTHER', description: 'Delivery', date: '2026-06-26T00:00:00.000Z' }),
]

async function mountView() {
  const wrapper = mount(SelfAssessmentView, { global: { stubs: { RouterLink: true } } })
  await flushPromises()
  return wrapper
}

describe('SelfAssessmentView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Freeze "now" inside the 2026/27 tax year so offset 0 selects it.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-30T12:00:00.000Z'))
    ;(apiService.getExpenses as any).mockResolvedValue(NORTH_PEAK_EXPENSES)
  })
  afterEach(() => vi.useRealTimers())

  it('shows the correct SA103S box totals and a net loss for the year', async () => {
    const text = (await mountView()).text()
    // Turnover (box 9) — nothing collected yet.
    expect(text).toContain('£0.00')
    // Box 20 total allowable expenses.
    expect(text).toContain('£211.52')
    // Box 11 goods/consumables: 19.99+2.00+1.70+29.99+14.97+2.49 = 71.14
    expect(text).toContain('£71.14')
    // Box 14 insurance & membership: 52.00 + 35.00 = 87.00
    expect(text).toContain('£87.00')
    // Box 19 other (marketing + delivery): 6.05+18.00+25.36+3.97 = 53.38
    expect(text).toContain('£53.38')
    // With £0 turnover this is a net loss, not a profit.
    expect(text).toContain('Net loss')
  })

  it('surfaces the pre-trading note when there is expense but no income', async () => {
    const text = (await mountView()).text()
    expect(text.toLowerCase()).toContain('pre-trading')
  })

  it('offers the box-20 single-figure shortcut below the VAT threshold', async () => {
    const text = (await mountView()).text()
    expect(text).toContain('box 20')
  })
})
