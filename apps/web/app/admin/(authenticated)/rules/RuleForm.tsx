'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createValidationRuleAction } from '@/app/actions/admin'

interface Category { id: string; name: string }
interface Slot { id: string; label: string }
interface Product { id: string; name: string }

type RuleType = 'pickup_slot_match' | 'max_quantity_per_product' | 'category_requires_slot'

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  pickup_slot_match: 'Zeitslot-Kompatibilität (Produkt nur in erlaubten Slots bestellbar)',
  max_quantity_per_product: 'Maximale Menge pro Produkt',
  category_requires_slot: 'Kategorie nur in bestimmten Zeitslots erlaubt',
}

export function CreateRuleForm({
  categories,
  slots,
  products,
  onDone,
}: {
  categories: Category[]
  slots: Slot[]
  products: Product[]
  onDone?: () => void
}) {
  const [state, action, isPending] = useActionState(createValidationRuleAction, null)
  const [type, setType] = useState<RuleType>('pickup_slot_match')
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state) return
    if ('success' in state) {
      formRef.current?.reset()
      toast.success('Regel erstellt.')
      onDone?.()
    } else {
      toast.error(state.error)
    }
  }, [state, onDone])

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Regel-Typ *</Label>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as RuleType)}
          className="mt-1 w-full h-9 px-3 border border-input bg-background text-sm focus:outline-none focus:border-foreground"
        >
          {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {type === 'max_quantity_per_product' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Produkt *</Label>
            <select
              name="productId"
              className="mt-1 w-full h-9 px-3 border border-input bg-background text-sm focus:outline-none focus:border-foreground"
              required
            >
              <option value="">Produkt wählen…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max. Menge *</Label>
            <Input name="max" type="number" min="1" step="1" placeholder="z.B. 3" required />
          </div>
        </div>
      )}

      {type === 'category_requires_slot' && (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kategorie *</Label>
            <select
              name="categoryId"
              className="mt-1 w-full h-9 px-3 border border-input bg-background text-sm focus:outline-none focus:border-foreground"
              required
            >
              <option value="">Kategorie wählen…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Erlaubte Zeitslots *</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {slots.map((slot) => (
                <label key={slot.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="allowedSlotIds" value={slot.id} className="w-4 h-4" />
                  {slot.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Erstelle…' : 'Regel erstellen'}
      </Button>
    </form>
  )
}
