'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { EditCategoryForm } from './CategoryForm'

interface CategoryRowProps {
  id: string
  name: string
  productCount: number
  deleteAction: (formData: FormData) => Promise<void>
}

export function CategoryRow({ id, name, productCount, deleteAction }: CategoryRowProps) {
  const [editing, setEditing] = useState(false)
  const stopEditing = useCallback(() => setEditing(false), [])

  if (editing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={3} className="px-4 py-2">
          <EditCategoryForm id={id} currentName={name} onDone={stopEditing} />
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="py-3 px-4 font-medium">{name}</td>
      <td className="py-3 px-4 text-right text-muted-foreground">{productCount}</td>
      <td className="py-3 px-4 text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Umbenennen
          </Button>
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
