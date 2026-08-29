import { getOrders } from '@repo/database'
import type { OrderStatus } from '@repo/database'
import { PageHeader } from '@/components/admin/PageHeader'
import { OrderStatusTabs } from './OrderStatusTabs'
import { OrderTable } from './OrderTable'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const validStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED']
  const filterStatus = validStatuses.includes(status as OrderStatus) ? (status as OrderStatus) : undefined

  const orders = await getOrders({ status: filterStatus })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bestellungen"
        description={`${orders.length} Bestellungen`}
        actions={
          <>
            <a
              href="/api/export/marketing-consent"
              className="text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              Newsletter-Einwilligungen
            </a>
            <a
              href="/api/export/orders"
              className="text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground"
            >
              CSV exportieren
            </a>
          </>
        }
      />

      <OrderStatusTabs status={filterStatus} />

      <OrderTable
        orders={orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          email: order.email,
          pickupSlotLabel: order.pickupSlot.label,
          items: order.items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            productName: item.product.name,
          })),
          marketingConsent: order.marketingConsent,
          status: order.status,
        }))}
      />
    </div>
  )
}
