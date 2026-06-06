'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { EditProductForm } from './ProductForm'
import { toggleProductAvailabilityAction } from '@/app/actions/admin'

interface Category { id: string; name: string }
interface Slot { id: string; label: string }

interface ProductRowProps {
  id: string
  name: string
  categoryName: string
  price: string
  available: boolean
  allowedSlotIds: string[]
  description: string
  imageUrl: string
  maxQuantity: string
  stock: string
  soldQuantity: number
  categories: Category[]
  slots: Slot[]
  deleteAction: (formData: FormData) => Promise<void>
}

export function ProductRow({
  id, name, categoryName, price, available, allowedSlotIds,
  description, imageUrl, maxQuantity, stock, soldQuantity, categories, slots, deleteAction,
}: ProductRowProps) {
  const [editing, setEditing] = useState(false)
  const stopEditing = useCallback(() => setEditing(false), [])

  const categoryId = categories.find((c) => c.name === categoryName)?.id ?? ''

  if (editing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={6} className="px-4 py-3">
          <EditProductForm
            id={id}
            defaults={{ name, description, price, categoryId, imageUrl, maxQuantity, stock, allowedSlotIds }}
            categories={categories}
            slots={slots}
            onDone={stopEditing}
          />
        </td>
      </tr>
    )
  }

  const stockDisplay = stock
    ? `${soldQuantity}/${stock}`
    : '∞'
  const stockLow = stock ? soldQuantity >= parseInt(stock) * 0.8 : false

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="py-3 px-4 font-medium">{name}</td>
      <td className="py-3 px-4 text-muted-foreground text-sm">{categoryName}</td>
      <td className="py-3 px-4 text-right font-mono text-sm">{parseFloat(price).toFixed(2)} €</td>
      <td className={`py-3 px-4 text-center font-mono text-sm ${stockLow ? 'text-warning font-bold' : 'text-muted-foreground'}`}>
        {stockDisplay}
      </td>
      <td className="py-3 px-4 text-center">
        <form action={toggleProductAvailabilityAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="available" value={String(available)} />
          <button type="submit"
            className={`text-xs font-bold px-2 py-0.5 ${available ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
            {available ? 'Aktiv' : 'Inaktiv'}
          </button>
        </form>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Bearbeiten</Button>
          <form action={deleteAction}>
            <input type="hidden" name="id" value={id} />
            <Button variant="ghost" size="sm" type="submit"
              className="text-destructive hover:text-destructive hover:bg-destructive/10">
              Löschen
            </Button>
          </form>
        </div>
      </td>
    </tr>
  )
}
