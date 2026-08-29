'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { deleteSlotAction } from '@/app/actions/admin'
import { EditSlotForm } from './SlotForm'

export interface SlotRow {
  id: string
  label: string
  startTime: Date
  endTime: Date
  capacity: number | null
  orderCount: number
}

function toDatetimeLocal(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SlotActions({ slot }: { slot: SlotRow }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const defaults = {
    label: slot.label,
    startTime: toDatetimeLocal(slot.startTime),
    endTime: toDatetimeLocal(slot.endTime),
    capacity: slot.capacity?.toString() ?? '',
  }

  async function handleDelete() {
    const formData = new FormData()
    formData.set('id', slot.id)
    const result = await deleteSlotAction(formData)
    if (result && 'error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Zeitslot gelöscht.')
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
        Bearbeiten
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setDeleteOpen(true)}
      >
        Löschen
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zeitslot bearbeiten</DialogTitle>
          </DialogHeader>
          <EditSlotForm id={slot.id} defaults={defaults} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Zeitslot löschen?"
        description={`„${slot.label}“ wird unwiderruflich gelöscht.`}
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

const columns: ColumnDef<SlotRow, unknown>[] = [
  {
    accessorKey: 'label',
    header: 'Label',
    cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
  },
  {
    accessorKey: 'startTime',
    header: 'Start',
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDateTime(row.original.startTime)}</span>,
  },
  {
    accessorKey: 'endTime',
    header: 'Ende',
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{formatDateTime(row.original.endTime)}</span>,
  },
  {
    id: 'occupancy',
    header: 'Belegt / Kapazität',
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.orderCount} / {row.original.capacity ?? '∞'}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <SlotActions slot={row.original} />,
  },
]

export function SlotTable({ slots }: { slots: SlotRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={slots}
      getRowId={(row) => row.id}
      emptyMessage="Noch keine Zeitslots angelegt."
    />
  )
}
