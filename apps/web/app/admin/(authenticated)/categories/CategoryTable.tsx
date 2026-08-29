'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { deleteCategoryAction } from '@/app/actions/admin'
import { EditCategoryForm } from './CategoryForm'

export interface CategoryRow {
  id: string
  name: string
  productCount: number
}

function CategoryActions({ category }: { category: CategoryRow }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleDelete() {
    const formData = new FormData()
    formData.set('id', category.id)
    const result = await deleteCategoryAction(formData)
    if (result && 'error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Kategorie gelöscht.')
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
        Umbenennen
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
            <DialogTitle>Kategorie umbenennen</DialogTitle>
          </DialogHeader>
          <EditCategoryForm id={category.id} currentName={category.name} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Kategorie löschen?"
        description={`„${category.name}“ wird unwiderruflich gelöscht.`}
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

const columns: ColumnDef<CategoryRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    accessorKey: 'productCount',
    header: 'Produkte',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.productCount}</span>,
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <CategoryActions category={row.original} />,
  },
]

export function CategoryTable({ categories }: { categories: CategoryRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={categories}
      getRowId={(row) => row.id}
      emptyMessage="Noch keine Kategorien angelegt."
    />
  )
}
