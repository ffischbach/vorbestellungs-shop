'use client'

import type { ColumnDef } from '@tanstack/react-table'
import type { OrderStatus } from '@repo/database'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'

export interface SlotUtilizationRow {
  id: string
  label: string
  timeRange: string
  occupied: number
  capacity: number | null
}

const slotColumns: ColumnDef<SlotUtilizationRow, unknown>[] = [
  {
    accessorKey: 'label',
    header: 'Slot',
    cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
  },
  {
    accessorKey: 'timeRange',
    header: 'Zeit',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.timeRange}</span>,
  },
  {
    accessorKey: 'occupied',
    header: 'Belegt',
    cell: ({ row }) => <span>{row.original.occupied}</span>,
  },
  {
    id: 'capacity',
    header: 'Kapazität',
    enableSorting: false,
    cell: ({ row }) => {
      const { capacity, occupied } = row.original
      const pct = capacity ? Math.round((occupied / capacity) * 100) : null
      return (
        <span className="text-muted-foreground">
          {capacity ?? '∞'}{pct !== null ? ` (${pct}%)` : ''}
        </span>
      )
    },
  },
]

export function SlotUtilizationTable({ slots }: { slots: SlotUtilizationRow[] }) {
  return <DataTable columns={slotColumns} data={slots} getRowId={(row) => row.id} />
}

export interface RecentOrderRow {
  id: string
  customerName: string
  pickupSlotLabel: string
  status: OrderStatus
}

const orderColumns: ColumnDef<RecentOrderRow, unknown>[] = [
  {
    accessorKey: 'customerName',
    header: 'Name',
    cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
  },
  {
    accessorKey: 'pickupSlotLabel',
    header: 'Slot',
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.pickupSlotLabel}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]

export function RecentOrdersTable({ orders }: { orders: RecentOrderRow[] }) {
  return <DataTable columns={orderColumns} data={orders} getRowId={(row) => row.id} />
}
