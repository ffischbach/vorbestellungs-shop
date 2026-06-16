import { getOrders } from '@repo/database'
import type { OrderStatus } from '@repo/database'
import { updateOrderStatusAction } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Ausstehend',
  CONFIRMED: 'Bestätigt',
  CANCELLED: 'Storniert',
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: 'bg-warning/10 text-warning-foreground',
  CONFIRMED: 'bg-success/10 text-success',
  CANCELLED: 'bg-muted text-muted-foreground',
}

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bestellungen</h1>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} Bestellungen</p>
        </div>
        <a
          href="/api/export/orders"
          className="text-sm font-medium underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          CSV exportieren
        </a>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {([undefined, 'PENDING', 'CONFIRMED', 'CANCELLED'] as const).map((s) => (
          <a
            key={s ?? 'all'}
            href={s ? `/admin/orders?status=${s}` : '/admin/orders'}
            className={`text-xs font-bold px-3 py-1.5 border transition-colors ${
              filterStatus === s
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
          >
            {s ? STATUS_LABELS[s] : 'Alle'}
          </a>
        ))}
      </div>

      <div className="border border-border">
        {orders.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Keine Bestellungen gefunden.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Bestellnr.</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">E-Mail</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Zeitslot</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Artikel</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Status</th>
                <th className="py-2 px-4 w-48" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/20 align-top">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{order.orderNumber}</td>
                  <td className="py-3 px-4 font-medium whitespace-nowrap">{order.customerName}</td>
                  <td className="py-3 px-4 text-muted-foreground text-sm">{order.email}</td>
                  <td className="py-3 px-4 text-muted-foreground text-sm whitespace-nowrap">{order.pickupSlot.label}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {order.items.map((item) => (
                      <div key={item.id}>{item.quantity}× {item.product.name}</div>
                    ))}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-bold px-2 py-0.5 ${STATUS_STYLES[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      {order.status !== 'CONFIRMED' && (
                        <form action={updateOrderStatusAction}>
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="status" value="CONFIRMED" />
                          <Button variant="ghost" size="sm" type="submit"
                            className="text-success hover:text-success hover:bg-success/10 text-xs">
                            Bestätigen
                          </Button>
                        </form>
                      )}
                      {order.status !== 'CANCELLED' && (
                        <form action={updateOrderStatusAction}>
                          <input type="hidden" name="id" value={order.id} />
                          <input type="hidden" name="status" value="CANCELLED" />
                          <Button variant="ghost" size="sm" type="submit"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">
                            Stornieren
                          </Button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
