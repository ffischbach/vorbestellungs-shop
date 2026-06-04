import { db } from '../index'

export async function getPickupSlots() {
  return db.pickupSlot.findMany({
    include: { products: true, orders: true },
    orderBy: { startTime: 'asc' },
  })
}

export async function getPickupSlotById(id: string) {
  return db.pickupSlot.findUnique({
    where: { id },
    include: { products: true, orders: true },
  })
}

export async function createPickupSlot(data: {
  label: string
  startTime: Date
  endTime: Date
  capacity?: number
}) {
  return db.pickupSlot.create({ data })
}

export async function updatePickupSlot(
  id: string,
  data: Partial<{
    label: string
    startTime: Date
    endTime: Date
    capacity: number | null
  }>
) {
  return db.pickupSlot.update({ where: { id }, data })
}

export async function deletePickupSlot(id: string) {
  return db.pickupSlot.delete({ where: { id } })
}

export async function getSlotOrderCount(slotId: string) {
  return db.order.count({
    where: { pickupSlotId: slotId, status: { not: 'CANCELLED' } },
  })
}
