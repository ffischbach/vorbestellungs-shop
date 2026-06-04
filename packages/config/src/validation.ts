export type ValidationRule =
  | {
      type: 'pickup_slot_match'
    }
  | {
      type: 'max_quantity_per_product'
      productId: string
      max: number
    }
  | {
      type: 'category_requires_slot'
      categoryId: string
      allowedSlotIds: string[]
    }

export type ValidationResult =
  | { valid: true }
  | { valid: false; rule: ValidationRule; message: string }

export type OrderContext = {
  pickupSlotId: string
  items: Array<{
    productId: string
    categoryId: string
    quantity: number
    allowedSlotIds: string[]
  }>
}
