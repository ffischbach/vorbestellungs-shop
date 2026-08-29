import { describe, expect, it } from 'vitest'
import { shopImportSchema } from '@repo/config'

const valid = {
  categories: [{ name: 'Speisen' }],
  slots: [
    {
      label: '11:00 - 12:00',
      startTime: '2026-07-19T11:00:00Z',
      endTime: '2026-07-19T12:00:00Z',
      capacity: 50,
    },
  ],
  products: [
    { name: 'Schnitzel', price: 8.5, categoryName: 'Speisen', slotLabels: ['11:00 - 12:00'] },
  ],
}

describe('shopImportSchema', () => {
  it('accepts a valid import payload', () => {
    expect(shopImportSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a product referencing an unknown category', () => {
    const invalid = { ...valid, products: [{ ...valid.products[0], categoryName: 'Getränke' }] }
    const result = shopImportSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects a product referencing an unknown slot label', () => {
    const invalid = { ...valid, products: [{ ...valid.products[0], slotLabels: ['unbekannt'] }] }
    const result = shopImportSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects an empty categories array', () => {
    const invalid = { ...valid, categories: [] }
    expect(shopImportSchema.safeParse(invalid).success).toBe(false)
  })

  it('allows a product without slotLabels', () => {
    const noSlots = { ...valid, products: [{ name: 'Kuchen', price: 2, categoryName: 'Speisen' }] }
    expect(shopImportSchema.safeParse(noSlots).success).toBe(true)
  })
})
