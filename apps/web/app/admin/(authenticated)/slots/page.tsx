import { getPickupSlots } from '@repo/database'
import { deleteSlotAction } from '@/app/actions/admin'
import { CreateSlotForm } from './SlotForm'
import { SlotRow } from './SlotRow'

export default async function SlotsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const slots = await getPickupSlots()
  const { error } = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Zeitslots</h1>
        <p className="text-muted-foreground text-sm mt-1">{slots.length} Zeitslots</p>
      </div>

      {error === 'hat_bestellungen' && (
        <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 px-4 py-2">
          Zeitslot kann nicht gelöscht werden — es existieren bereits Bestellungen für diesen Slot.
        </p>
      )}

      <div className="border border-border">
        {slots.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">Noch keine Zeitslots angelegt.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Label</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Start</th>
                <th className="text-left py-2 px-4 font-medium text-muted-foreground">Ende</th>
                <th className="text-right py-2 px-4 font-medium text-muted-foreground">Belegt / Kapazität</th>
                <th className="py-2 px-4 w-44" />
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <SlotRow
                  key={slot.id}
                  id={slot.id}
                  label={slot.label}
                  startTime={slot.startTime}
                  endTime={slot.endTime}
                  capacity={slot.capacity}
                  orderCount={slot._count.orders}
                  deleteAction={deleteSlotAction}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border border-border p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Neuer Zeitslot</h2>
        <CreateSlotForm />
      </div>
    </div>
  )
}
