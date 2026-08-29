import { getPickupSlots } from '@repo/database'
import { PageHeader } from '@/components/admin/PageHeader'
import { SlotTable } from './SlotTable'
import { NewSlotDialog } from './NewSlotDialog'

export default async function SlotsPage() {
  const slots = await getPickupSlots()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zeitslots"
        description={`${slots.length} Zeitslots`}
        actions={<NewSlotDialog />}
      />

      <SlotTable
        slots={slots.map((slot) => ({
          id: slot.id,
          label: slot.label,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          orderCount: slot._count.orders,
        }))}
      />
    </div>
  )
}
