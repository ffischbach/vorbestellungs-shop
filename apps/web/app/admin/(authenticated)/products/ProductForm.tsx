'use client'

import { useActionState, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createProductAction, updateProductAction, type ActionState } from '@/app/actions/admin'

interface Category { id: string; name: string }
interface Slot { id: string; label: string }

interface ProductFieldsProps {
  categories: Category[]
  slots: Slot[]
  defaults?: {
    name: string
    description: string
    price: string
    categoryId: string
    imageUrl: string
    maxQuantity: string
    allowedSlotIds: string[]
  }
}

function ProductFields({ categories, slots, defaults }: ProductFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name *</Label>
          <Input name="name" placeholder="Produktname" defaultValue={defaults?.name} className="mt-1" required />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preis (€) *</Label>
          <Input name="price" type="number" min="0" step="0.01" placeholder="0.00" defaultValue={defaults?.price} className="mt-1" required />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kategorie *</Label>
          <select
            name="categoryId"
            defaultValue={defaults?.categoryId}
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
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max. Menge pro Bestellung</Label>
          <Input name="maxQuantity" type="number" min="1" placeholder="unbegrenzt" defaultValue={defaults?.maxQuantity} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Beschreibung</Label>
          <Input name="description" placeholder="Kurze Beschreibung" defaultValue={defaults?.description} className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bild-URL</Label>
          <Input name="imageUrl" type="url" placeholder="https://…" defaultValue={defaults?.imageUrl} className="mt-1" />
        </div>
      </div>

      {slots.length > 0 && (
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verfügbar in Zeitslots</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {slots.map((slot) => (
              <label key={slot.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="allowedSlotIds"
                  value={slot.id}
                  defaultChecked={defaults?.allowedSlotIds.includes(slot.id)}
                  className="w-4 h-4"
                />
                {slot.label}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function CreateProductForm({ categories, slots }: { categories: Category[]; slots: Slot[] }) {
  const [state, action, isPending] = useActionState(createProductAction, null)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (state && 'success' in state) setKey((k) => k + 1)
  }, [state])

  return (
    <form key={key} action={action} className="space-y-4">
      <ProductFields categories={categories} slots={slots} />
      {state && 'error' in state && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Erstelle…' : 'Produkt erstellen'}
      </Button>
    </form>
  )
}

export function EditProductForm({
  id,
  defaults,
  categories,
  slots,
  onDone,
}: {
  id: string
  defaults: ProductFieldsProps['defaults'] & {}
  categories: Category[]
  slots: Slot[]
  onDone: () => void
}) {
  const [state, action, isPending] = useActionState(updateProductAction, null)

  useEffect(() => {
    if (state && 'success' in state) onDone()
  }, [state, onDone])

  return (
    <form action={action} className="space-y-4 p-4 border border-border bg-muted/20">
      <input type="hidden" name="id" value={id} />
      <ProductFields categories={categories} slots={slots} defaults={defaults} />
      {state && 'error' in state && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? 'Speichere…' : 'Speichern'}</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Abbrechen</Button>
      </div>
    </form>
  )
}
