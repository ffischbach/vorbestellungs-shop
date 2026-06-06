import Link from 'next/link'
import { getOrderStats, getOrders, getPickupSlots, getCategories, getProducts, getClubConfigFromDb } from '@repo/database'
import { buildTimeSlots } from '@/lib/slots'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [stats, slots, recentOrders, categories, products, dbConfig] = await Promise.all([
    getOrderStats(),
    getPickupSlots(),
    getOrders(),
    getCategories(),
    getProducts(),
    getClubConfigFromDb(),
  ])

  const timeSlots = buildTimeSlots(slots)

  const s3PublicUrl = process.env.S3_PUBLIC_URL
  const setupSteps = [
    {
      key: 'settings',
      label: 'Vereinseinstellungen konfigurieren',
      href: '/admin/settings',
      done: dbConfig !== null,
    },
    ...(s3PublicUrl ? [{
      key: 'logo',
      label: 'Vereinslogo hochladen',
      href: '/admin/settings',
      done: Boolean(dbConfig?.logoUrl?.startsWith(s3PublicUrl)),
    }] : []),
    {
      key: 'categories',
      label: 'Mindestens eine Kategorie anlegen',
      href: '/admin/categories',
      done: categories.length > 0,
    },
    {
      key: 'products',
      label: 'Mindestens ein Produkt anlegen',
      href: '/admin/products',
      done: products.length > 0,
    },
    {
      key: 'slots',
      label: 'Mindestens einen Zeitslot anlegen',
      href: '/admin/slots',
      done: slots.length > 0,
    },
  ]

  const allDone = setupSteps.every((s) => s.done)
  const doneCount = setupSteps.filter((s) => s.done).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Übersicht aller Bestellungen</p>
      </div>

      {/* Setup Checklist */}
      {!allDone && (
        <div className="border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm">Ersteinrichtung</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {doneCount} von {setupSteps.length} Schritten abgeschlossen
              </p>
            </div>
            <div className="flex gap-1">
              {setupSteps.map((step) => (
                <div
                  key={step.key}
                  className={`w-2 h-2 rounded-full ${step.done ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>
          <ul className="divide-y divide-border">
            {setupSteps.map((step) => (
              <li key={step.key}>
                <Link
                  href={step.href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span
                    className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs
                      ${step.done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'}`}
                  >
                    {step.done ? '✓' : ''}
                  </span>
                  <span className={`text-sm ${step.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
                    {step.label}
                  </span>
                  {!step.done && (
                    <span className="ml-auto text-xs text-muted-foreground">→</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt', value: stats.total },
          { label: 'Ausstehend', value: stats.pending },
          { label: 'Bestätigt', value: stats.confirmed },
          { label: 'Storniert', value: stats.cancelled },
        ].map((stat) => (
          <div key={stat.label} className="border border-border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Slot Utilization */}
      {slots.length > 0 && (
        <div>
          <h2 className="text-base font-bold tracking-tight mb-3">Zeitslot-Auslastung</h2>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Slot</th>
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Zeit</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">Belegt</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">Kapazität</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, i) => {
                  const ts = timeSlots[i]
                  const pct = slot.capacity ? Math.round((slot._count.orders / slot.capacity) * 100) : null
                  return (
                    <tr key={slot.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 px-4 font-medium">{slot.label}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{ts.startTime} – {ts.endTime}</td>
                      <td className="py-2.5 px-4 text-right">{slot._count.orders}</td>
                      <td className="py-2.5 px-4 text-right text-muted-foreground">
                        {slot.capacity ?? '∞'}{pct !== null ? ` (${pct}%)` : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <h2 className="text-base font-bold tracking-tight mb-3">Letzte Bestellungen</h2>
          <div className="border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Slot</th>
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 px-4 font-medium">{order.customerName}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{order.pickupSlot.label}</td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-warning/10 text-warning-foreground',
    CONFIRMED: 'bg-success/10 text-success',
    CANCELLED: 'bg-muted text-muted-foreground',
  }
  const labels: Record<string, string> = {
    PENDING: 'Ausstehend',
    CONFIRMED: 'Bestätigt',
    CANCELLED: 'Storniert',
  }
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 ${styles[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}
