'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { OrderStatus } from '@repo/database'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { STATUS_LABELS } from '@/components/admin/StatusBadge'

const STATUS_FILTERS = [undefined, 'PENDING', 'CONFIRMED', 'CANCELLED'] as const

export function OrderStatusTabs({ status }: { status?: OrderStatus }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <Tabs
      value={status ?? 'all'}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value === 'all') {
          params.delete('status')
        } else {
          params.set('status', value)
        }
        const query = params.toString()
        router.push(query ? `/admin/orders?${query}` : '/admin/orders')
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
