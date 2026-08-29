import Link from 'next/link'
import { getOrderStats, getOrders, getPickupSlots, getCategories, getProducts, getClubConfigFromDb } from '@repo/database'
import { buildTimeSlots } from '@/lib/slots'
import { PageHeader } from '@/components/admin/PageHeader'
import { SlotUtilizationTable, RecentOrdersTable } from './DashboardTables'

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
      <PageHeader title="Dashboard" description="Übersicht aller Bestellungen" />

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Gesamt', value: stats.total },
          { label: 'Ausstehend', value: stats.pending },
          { label: 'Bestätigt', value: stats.confirmed },
          { label: 'Storniert', value: stats.cancelled },
          { label: 'Umsatz', value: `${stats.totalRevenue.toFixed(2).replace('.', ',')} €` },
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
          <SlotUtilizationTable
            slots={slots.map((slot, i) => ({
              id: slot.id,
              label: slot.label,
              timeRange: `${timeSlots[i].startTime} – ${timeSlots[i].endTime}`,
              occupied: slot._count.orders,
              capacity: slot.capacity,
            }))}
          />
        </div>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <h2 className="text-base font-bold tracking-tight mb-3">Letzte Bestellungen</h2>
          <RecentOrdersTable
            orders={recentOrders.slice(0, 10).map((order) => ({
              id: order.id,
              customerName: order.customerName,
              pickupSlotLabel: order.pickupSlot.label,
              status: order.status,
            }))}
          />
        </div>
      )}
    </div>
  )
}
