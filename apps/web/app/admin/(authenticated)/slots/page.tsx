import { getPickupSlots } from '@repo/database'
import { getClubConfig } from '@/club.config'
import { PageHeader } from '@/components/admin/PageHeader'
import { SlotTable } from './SlotTable'
import { NewSlotDialog } from './NewSlotDialog'

export default async function SlotsPage() {
  const [slots, clubConfig] = await Promise.all([getPickupSlots(), getClubConfig()])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zeitslots"
        description={`${slots.length} Zeitslots`}
        actions={<NewSlotDialog />}
      />

      <SlotTable
        timezone={clubConfig.timezone}
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
