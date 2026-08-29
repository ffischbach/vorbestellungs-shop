'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { deleteProductAction, toggleProductAvailabilityAction } from '@/app/actions/admin'
import { EditProductForm } from './ProductForm'

interface Category { id: string; name: string }
interface Slot { id: string; label: string }

export interface ProductRow {
  id: string
  name: string
  categoryId: string
  categoryName: string
  price: string
  available: boolean
  allowedSlotIds: string[]
  description: string
  imageUrl: string
  maxQuantity: string
  stock: string
  soldQuantity: number
}

function AvailabilityToggle({ id, available }: { id: string; available: boolean }) {
  return (
    <form action={toggleProductAvailabilityAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="available" value={String(available)} />
      <button
        type="submit"
        className={`text-xs font-bold px-2 py-0.5 ${available ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}
      >
        {available ? 'Aktiv' : 'Inaktiv'}
      </button>
    </form>
  )
}

function ProductActions({
  product,
  categories,
  slots,
}: {
  product: ProductRow
  categories: Category[]
  slots: Slot[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleDelete() {
    const formData = new FormData()
    formData.set('id', product.id)
    const result = await deleteProductAction(formData)
    if (result && 'error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Produkt gelöscht.')
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produkt bearbeiten</DialogTitle>
          </DialogHeader>
          <EditProductForm
            id={product.id}
            defaults={{
              name: product.name,
              description: product.description,
              price: product.price,
              categoryId: product.categoryId,
              imageUrl: product.imageUrl,
              maxQuantity: product.maxQuantity,
              stock: product.stock,
              allowedSlotIds: product.allowedSlotIds,
            }}
            categories={categories}
            slots={slots}
            onDone={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Produkt löschen?"
        description={`„${product.name}“ wird unwiderruflich gelöscht.`}
        confirmLabel="Löschen"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}

export function ProductTable({
  products,
  categories,
  slots,
}: {
  products: ProductRow[]
  categories: Category[]
  slots: Slot[]
}) {
  const columns: ColumnDef<ProductRow, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'categoryName',
      header: 'Kategorie',
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.categoryName}</span>,
    },
    {
      accessorKey: 'price',
      header: 'Preis',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{parseFloat(row.original.price).toFixed(2)} €</span>
      ),
    },
    {
      id: 'stock',
      header: 'Bestand',
      enableSorting: false,
      cell: ({ row }) => {
        const { stock, soldQuantity } = row.original
        const stockDisplay = stock ? `${soldQuantity}/${stock}` : '∞'
        const stockLow = stock ? soldQuantity >= parseInt(stock) * 0.8 : false
        return (
          <span className={`font-mono text-sm ${stockLow ? 'text-warning font-bold' : 'text-muted-foreground'}`}>
            {stockDisplay}
          </span>
        )
      },
    },
    {
      id: 'available',
      header: 'Status',
      enableSorting: false,
      cell: ({ row }) => <AvailabilityToggle id={row.original.id} available={row.original.available} />,
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => <ProductActions product={row.original} categories={categories} slots={slots} />,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={products}
      getRowId={(row) => row.id}
      emptyMessage="Noch keine Produkte angelegt."
    />
  )
}
