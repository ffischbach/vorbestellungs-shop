import { describe, expect, it } from 'vitest'
import type { OrderContext, ValidationRule } from '@repo/config'
import { evaluateRules } from './evaluate'

const base: OrderContext = {
  pickupSlotId: 'slot-1',
  items: [
    { productId: 'prod-1', categoryId: 'cat-1', quantity: 1, allowedSlotIds: ['slot-1'] },
  ],
}

describe('evaluateRules', () => {
  it('returns empty array when no rules given', () => {
    expect(evaluateRules([], base)).toEqual([])
  })

  describe('pickup_slot_match', () => {
    const rule: ValidationRule = { type: 'pickup_slot_match' }

    it('passes when all products allow the selected slot', () => {
      expect(evaluateRules([rule], base)[0]).toEqual({ valid: true })
    })

    it('fails when a product does not allow the selected slot', () => {
      const ctx: OrderContext = {
        ...base,
        items: [{ productId: 'prod-1', categoryId: 'cat-1', quantity: 1, allowedSlotIds: ['slot-2'] }],
      }
      expect(evaluateRules([rule], ctx)[0]).toMatchObject({ valid: false, rule })
    })

    it('passes when cart is empty', () => {
      expect(evaluateRules([rule], { ...base, items: [] })[0]).toEqual({ valid: true })
    })
  })

  describe('max_quantity_per_product', () => {
    const rule: ValidationRule = { type: 'max_quantity_per_product', productId: 'prod-1', max: 3 }

    it('passes when quantity is within limit', () => {
      expect(evaluateRules([rule], base)[0]).toEqual({ valid: true })
    })

    it('passes when product is not in cart', () => {
      const rule2: ValidationRule = { type: 'max_quantity_per_product', productId: 'prod-other', max: 1 }
      expect(evaluateRules([rule2], base)[0]).toEqual({ valid: true })
    })

    it('fails when quantity exceeds the limit', () => {
      const ctx: OrderContext = {
        ...base,
        items: [{ productId: 'prod-1', categoryId: 'cat-1', quantity: 4, allowedSlotIds: ['slot-1'] }],
      }
      expect(evaluateRules([rule], ctx)[0]).toMatchObject({ valid: false, rule })
    })

    it('passes when quantity equals the limit exactly', () => {
      const ctx: OrderContext = {
        ...base,
        items: [{ productId: 'prod-1', categoryId: 'cat-1', quantity: 3, allowedSlotIds: ['slot-1'] }],
      }
      expect(evaluateRules([rule], ctx)[0]).toEqual({ valid: true })
    })
  })

  describe('category_requires_slot', () => {
    const rule: ValidationRule = {
      type: 'category_requires_slot',
      categoryId: 'cat-1',
      allowedSlotIds: ['slot-1'],
    }

    it('passes when category items are in an allowed slot', () => {
      expect(evaluateRules([rule], base)[0]).toEqual({ valid: true })
    })

    it('passes when no items from the category are in the cart', () => {
      const ctx: OrderContext = {
        ...base,
        items: [{ productId: 'prod-1', categoryId: 'cat-other', quantity: 1, allowedSlotIds: ['slot-1'] }],
      }
      expect(evaluateRules([rule], ctx)[0]).toEqual({ valid: true })
    })

    it('fails when category items are in a disallowed slot', () => {
      const ctx: OrderContext = {
        pickupSlotId: 'slot-2',
        items: [{ productId: 'prod-1', categoryId: 'cat-1', quantity: 1, allowedSlotIds: ['slot-1', 'slot-2'] }],
      }
      expect(evaluateRules([rule], ctx)[0]).toMatchObject({ valid: false, rule })
    })
  })

  it('evaluates multiple rules independently', () => {
    const rules: ValidationRule[] = [
      { type: 'pickup_slot_match' },
      { type: 'max_quantity_per_product', productId: 'prod-1', max: 3 },
    ]
    const results = evaluateRules(rules, base)
    expect(results).toHaveLength(2)
    expect(results.every((r) => r.valid)).toBe(true)
  })
})
