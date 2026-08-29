import { formatInTimeZone } from '@repo/config'
import type { TimeSlot } from '@/components/shop/TimeSlotPicker'

type SlotRow = {
  id: string
  label: string
  startTime: Date
  endTime: Date
  capacity: number | null
  _count: { orders: number }
}

// INV-10: Uhrzeit-Anzeige in der Vereins-Timezone, nicht Server-lokal — siehe docs/domain/invariants.md
export function buildTimeSlots(slots: SlotRow[], timezone: string): TimeSlot[] {
  return slots.map((slot) => {
    const capacity = slot.capacity ?? Infinity
    const activeOrders = slot._count.orders
    const remaining = capacity - activeOrders

    let status: TimeSlot['status'] = 'available'
    if (remaining <= 0) status = 'full'
    else if (remaining <= 5) status = 'limited'

    return {
      id: slot.id,
      label: slot.label,
      startTime: formatInTimeZone(slot.startTime, timezone, { hour: '2-digit', minute: '2-digit' }),
      endTime: formatInTimeZone(slot.endTime, timezone, { hour: '2-digit', minute: '2-digit' }),
      status,
      remainingCapacity: capacity !== Infinity ? Math.max(0, remaining) : undefined,
    }
  })
}
