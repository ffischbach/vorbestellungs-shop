import { z } from 'zod'

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

// INV-09: Grenze, an der ein aus der DB gelesenes Json-Feld auf ValidationRule geprüft
// wird — siehe docs/domain/invariants.md
export const validationRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('pickup_slot_match') }),
  z.object({
    type: z.literal('max_quantity_per_product'),
    productId: z.string().min(1),
    max: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('category_requires_slot'),
    categoryId: z.string().min(1),
    allowedSlotIds: z.array(z.string().min(1)).min(1),
  }),
]) satisfies z.ZodType<ValidationRule>

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
