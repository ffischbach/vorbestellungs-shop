import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getOrderById } from '@repo/database'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PrintButton } from './PrintButton'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await getOrderById(id)
  if (!order) notFound()

  // INV-02: Preis-Snapshot (item.price), nicht Product.price — siehe docs/domain/invariants.md
  const total = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="size-4" />
          Zurück zur Übersicht
        </Link>
        <PageHeader
          title={`Bestellung #${order.orderNumber}`}
          description={order.customerName}
          actions={<PrintButton />}
        />
      </div>

      <div className="border border-border bg-card p-6 space-y-6 print:border-0 print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bestellnummer</p>
            <p className="text-2xl font-bold mt-1">#{order.orderNumber}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Name</p>
            <p className="text-sm mt-1">{order.customerName}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-Mail</p>
            <p className="text-sm mt-1">{order.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zeitslot</p>
            <p className="text-sm mt-1">{order.pickupSlot.label}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Artikel</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 font-medium">Produkt</th>
                <th className="py-2 font-medium text-right">Menge</th>
                <th className="py-2 font-medium text-right">Einzelpreis</th>
                <th className="py-2 font-medium text-right">Summe</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="py-2">{item.product.name}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 text-right">{Number(item.price).toFixed(2).replace('.', ',')} €</td>
                  <td className="py-2 text-right font-medium">
                    {(Number(item.price) * item.quantity).toFixed(2).replace('.', ',')} €
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right font-bold">Gesamt</td>
                <td className="pt-3 text-right font-bold">{total.toFixed(2).replace('.', ',')} €</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex flex-col items-center gap-2 print:hidden">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            QR-Code für die Abholung
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr?data=${encodeURIComponent(order.orderNumber)}`}
            width={160}
            height={160}
            alt={`QR-Code Bestellung #${order.orderNumber}`}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Newsletter-Einwilligung: {order.marketingConsent ? 'Ja' : 'Nein'}
        </p>
      </div>
    </div>
  )
}
