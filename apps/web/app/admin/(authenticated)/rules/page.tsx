import { getValidationRules, getCategories, getPickupSlots, getProducts } from '@repo/database'
import type { ValidationRule } from '@repo/config'
import { PageHeader } from '@/components/admin/PageHeader'
import { RuleTable, type RuleRow } from './RuleTable'
import { NewRuleDialog } from './NewRuleDialog'

const RULE_TYPE_LABELS: Record<ValidationRule['type'], string> = {
  pickup_slot_match: 'Zeitslot-Kompatibilität',
  max_quantity_per_product: 'Max. Menge pro Produkt',
  category_requires_slot: 'Kategorie nur in bestimmten Slots',
}

export default async function RulesPage() {
  const [rules, categories, slots, products] = await Promise.all([
    getValidationRules(),
    getCategories(),
    getPickupSlots(),
    getProducts(),
  ])

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]))
  const slotLabels = new Map(slots.map((s) => [s.id, s.label]))
  const productNames = new Map(products.map((p) => [p.id, p.name]))

  function summarize(rule: ValidationRule): string {
    switch (rule.type) {
      case 'pickup_slot_match':
        return 'Produkte nur in ihren erlaubten Zeitslots bestellbar.'
      case 'max_quantity_per_product':
        return `${productNames.get(rule.productId) ?? 'Unbekanntes Produkt'}: max. ${rule.max} pro Bestellung.`
      case 'category_requires_slot':
        return `${categoryNames.get(rule.categoryId) ?? 'Unbekannte Kategorie'}: erlaubt in [${rule.allowedSlotIds
          .map((id) => slotLabels.get(id) ?? id)
          .join(', ')}].`
    }
  }

  const rows: RuleRow[] = rules.map((r) => ({
    id: r.id,
    enabled: r.enabled,
    typeLabel: RULE_TYPE_LABELS[r.rule.type],
    summary: summarize(r.rule),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validierungsregeln"
        description={`${rules.length} Regeln`}
        actions={
          <NewRuleDialog
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            slots={slots.map((s) => ({ id: s.id, label: s.label }))}
            products={products.map((p) => ({ id: p.id, name: p.name }))}
          />
        }
      />

      <RuleTable rules={rows} />
    </div>
  )
}
