'use client'

import { useRouter } from 'next/navigation'
import type { OrderStatus } from '@repo/database'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STATUS_LABELS } from '@/components/admin/StatusBadge'

const STATUS_FILTERS = [undefined, 'PENDING', 'CONFIRMED', 'CANCELLED'] as const

export function OrderStatusTabs({ status }: { status?: OrderStatus }) {
  const router = useRouter()

  return (
    <Tabs
      value={status ?? 'all'}
      onValueChange={(value) => {
        router.push(value === 'all' ? '/admin/orders' : `/admin/orders?status=${value}`)
      }}
    >
      <TabsList>
        {STATUS_FILTERS.map((s) => (
          <TabsTrigger key={s ?? 'all'} value={s ?? 'all'}>
            {s ? STATUS_LABELS[s] : 'Alle'}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
