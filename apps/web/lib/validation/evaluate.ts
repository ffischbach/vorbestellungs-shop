import type { OrderContext, ValidationResult, ValidationRule } from '@repo/config'

export function evaluateRules(
  rules: ValidationRule[],
  context: OrderContext
): ValidationResult[] {
  return rules.map((rule) => evaluate(rule, context))
}

function evaluate(rule: ValidationRule, context: OrderContext): ValidationResult {
  switch (rule.type) {
    case 'pickup_slot_match': {
      const incompatible = context.items.filter(
        (item) => !item.allowedSlotIds.includes(context.pickupSlotId)
      )
      if (incompatible.length > 0) {
        return {
          valid: false,
          rule,
          message: 'Ein oder mehrere Produkte sind für den gewählten Zeitslot nicht verfügbar.',
        }
      }
      return { valid: true }
    }

    case 'max_quantity_per_product': {
      const item = context.items.find((i) => i.productId === rule.productId)
      if (item && item.quantity > rule.max) {
        return {
          valid: false,
          rule,
          message: `Maximale Bestellmenge von ${rule.max} für dieses Produkt überschritten.`,
        }
      }
      return { valid: true }
    }

    case 'category_requires_slot': {
      const categoryItems = context.items.filter((i) => i.categoryId === rule.categoryId)
      if (
        categoryItems.length > 0 &&
        !rule.allowedSlotIds.includes(context.pickupSlotId)
      ) {
        return {
          valid: false,
          rule,
          message: 'Diese Produktkategorie ist nur in bestimmten Zeitslots verfügbar.',
        }
      }
      return { valid: true }
    }
  }
}
