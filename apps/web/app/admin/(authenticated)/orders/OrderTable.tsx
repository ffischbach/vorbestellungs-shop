'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { ColumnDef } from '@tanstack/react-table'
import type { OrderStatus } from '@repo/database'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { updateOrderStatusAction } from '@/app/actions/admin'

export interface OrderRow {
  id: string
  orderNumber: string
  customerName: string
  email: string
  pickupSlotLabel: string
  items: { id: string; quantity: number; productName: string }[]
  marketingConsent: boolean
  status: OrderStatus
}

async function setStatus(id: string, status: OrderStatus) {
  const formData = new FormData()
  formData.set('id', id)
  formData.set('status', status)
  return updateOrderStatusAction(formData)
}

function OrderActions({ order }: { order: OrderRow }) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function handleConfirm() {
    setConfirming(true)
    const result = await setStatus(order.id, 'CONFIRMED')
    setConfirming(false)
    if (result && 'error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Bestellung bestätigt.')
  }

  async function handleCancel() {
    const result = await setStatus(order.id, 'CANCELLED')
    if (result && 'error' in result) {
      toast.error(result.error)
      return
    }
    toast.success('Bestellung storniert.')
  }

  return (
    <div className="flex justify-end gap-1">
      {order.status !== 'CONFIRMED' && (
        <Button
          variant="ghost"
          size="sm"
          className="text-success hover:text-success hover:bg-success/10 text-xs"
          disabled={confirming}
          onClick={handleConfirm}
        >
          Bestätigen
        </Button>
      )}
      {order.status !== 'CANCELLED' && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
            onClick={() => setCancelOpen(true)}
          >
            Stornieren
          </Button>
          <ConfirmDialog
            open={cancelOpen}
            onOpenChange={setCancelOpen}
            title="Bestellung stornieren?"
            description={`Bestellung ${order.orderNumber} von ${order.customerName} wird storniert.`}
            confirmLabel="Stornieren"
            variant="destructive"
            onConfirm={handleCancel}
          />
        </>
      )}
    </div>
  )
}

const columns: ColumnDef<OrderRow, unknown>[] = [
  {
    accessorKey: 'orderNumber',
    header: 'Bestellnr.',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{row.original.orderNumber}</span>
    ),
  },
  {
    accessorKey: 'customerName',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium whitespace-nowrap">{row.original.customerName}</span>,
  },
  {
    accessorKey: 'email',
    header: 'E-Mail',
    cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.email}</span>,
  },
  {
    accessorKey: 'pickupSlotLabel',
    header: 'Zeitslot',
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm whitespace-nowrap">{row.original.pickupSlotLabel}</span>
    ),
  },
  {
    id: 'items',
    header: 'Artikel',
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.original.items.map((item) => (
          <div key={item.id}>{item.quantity}× {item.productName}</div>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'marketingConsent',
    header: 'Newsletter',
    cell: ({ row }) =>
      row.original.marketingConsent ? (
        <span className="text-success font-medium text-sm">Ja</span>
      ) : (
        <span className="text-muted-foreground text-sm">–</span>
      ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <OrderActions order={row.original} />,
  },
]

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={orders}
      getRowId={(row) => row.id}
      emptyMessage="Keine Bestellungen gefunden."
    />
  )
}
