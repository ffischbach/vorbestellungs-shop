'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { deleteValidationRuleAction, toggleValidationRuleAction } from '@/app/actions/admin'

export interface RuleRow {
  id: string
  enabled: boolean
  typeLabel: string
  summary: string
}

function EnabledToggle({ id, enabled }: { id: string; enabled: boolean }) {
  return (
    <form action={toggleValidationRuleAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="enabled" value={String(enabled)} />
      <button
        type="submit"
        className={`text-xs font-bold px-2 py-0.5 ${enabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
      >
        {enabled ? 'Aktiv' : 'Deaktiviert'}
      </button>
    </form>
  )
}

function RuleActions({ rule }: { rule: RuleRow }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleDelete() {
    const formData = new FormData()
    formData.set('id', rule.id)
    const result = await deleteValidationRuleAction(formData)
    if (result && 'error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Regel gelöscht.')
  }

  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setDeleteOpen(true)}
      >
        Löschen
      </Button>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Regel löschen?"
        description="Diese Validierungsregel wird unwiderruflich gelöscht."
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

const columns: ColumnDef<RuleRow, unknown>[] = [
  {
    accessorKey: 'typeLabel',
    header: 'Typ',
    cell: ({ row }) => <span className="font-medium">{row.original.typeLabel}</span>,
  },
  {
    accessorKey: 'summary',
    header: 'Details',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.summary}</span>,
  },
  {
    id: 'enabled',
    header: 'Status',
    cell: ({ row }) => <EnabledToggle id={row.original.id} enabled={row.original.enabled} />,
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <RuleActions rule={row.original} />,
  },
]

export function RuleTable({ rules }: { rules: RuleRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={rules}
      getRowId={(row) => row.id}
      emptyMessage="Noch keine Validierungsregeln angelegt."
    />
  )
}
