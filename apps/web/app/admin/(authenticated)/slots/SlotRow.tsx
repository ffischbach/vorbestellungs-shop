'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { EditSlotForm } from './SlotForm'

interface SlotRowProps {
  id: string
  label: string
  startTime: Date
  endTime: Date
  capacity: number | null
  orderCount: number
  deleteAction: (formData: FormData) => Promise<void>
}

function toDatetimeLocal(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function SlotRow({ id, label, startTime, endTime, capacity, orderCount, deleteAction }: SlotRowProps) {
  const [editing, setEditing] = useState(false)
  const stopEditing = useCallback(() => setEditing(false), [])

  const defaults = {
    label,
    startTime: toDatetimeLocal(startTime),
    endTime: toDatetimeLocal(endTime),
    capacity: capacity?.toString() ?? '',
  }

  if (editing) {
    return (
      <tr className="border-b border-border last:border-0">
        <td colSpan={5} className="px-4 py-3">
          <EditSlotForm id={id} defaults={defaults} onDone={stopEditing} />
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/20">
      <td className="py-3 px-4 font-medium">{label}</td>
      <td className="py-3 px-4 text-muted-foreground text-sm">{formatDateTime(startTime)}</td>
      <td className="py-3 px-4 text-muted-foreground text-sm">{formatDateTime(endTime)}</td>
      <td className="py-3 px-4 text-right text-muted-foreground">
        {orderCount} / {capacity ?? '∞'}
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
