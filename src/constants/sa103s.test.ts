import { describe, it, expect } from 'vitest'
import {
  CATEGORY_TO_SA103S_BOX,
  SA103S_EXPENSE_BOXES,
  sa103sBoxForCategory,
  sa103sBoxLabel,
} from './sa103s'
import { EXPENSE_CATEGORIES } from './expenseCategories'

describe('SA103S category mapping', () => {
  it('maps every expense category to a real SA103S expense box (11–19)', () => {
    const validBoxes = new Set(SA103S_EXPENSE_BOXES.map((b) => b.box))
    for (const c of EXPENSE_CATEGORIES) {
      const box = sa103sBoxForCategory(c.value)
      expect(validBoxes.has(box), `${c.value} → box ${box}`).toBe(true)
    }
  })

  it('keeps the mapping table and the category list in sync', () => {
    const mapped = Object.keys(CATEGORY_TO_SA103S_BOX).sort()
    const known = EXPENSE_CATEGORIES.map((c) => c.value).sort()
    expect(mapped).toEqual(known)
  })

  it('puts goods/consumables in box 11 and travel in box 12', () => {
    expect(sa103sBoxForCategory('SUPPLIES')).toBe(11)
    expect(sa103sBoxForCategory('MILEAGE')).toBe(12)
    expect(sa103sBoxForCategory('TRAVEL')).toBe(12)
  })

  it('funnels categories with no dedicated short-form box into box 19', () => {
    expect(sa103sBoxForCategory('MARKETING')).toBe(19)
    expect(sa103sBoxForCategory('TRAINING')).toBe(19)
    expect(sa103sBoxForCategory('CLOTHING_LAUNDRY')).toBe(19)
    expect(sa103sBoxForCategory('OTHER')).toBe(19)
  })

  it('exposes the official HMRC label for a box', () => {
    expect(sa103sBoxLabel(12)).toBe('Car, van and travel expenses')
  })
})
