import { db } from '../index'

export interface SlotHealth {
  id: string
  label: string
  orders: number
  capacity: number | null
  occupancyPercent: number | null
}

export interface HealthMetrics {
  orders: {
    total: number
    pending: number
    confirmed: number
    cancelled: number
  }
  slots: SlotHealth[]
  remindersPending: number
}

export async function getHealthMetrics(): Promise<HealthMetrics> {
  const [orderCounts, slots, remindersPending] = await Promise.all([
    Promise.all([
      db.order.count(),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { status: 'CONFIRMED' } }),
      db.order.count({ where: { status: 'CANCELLED' } }),
    ]),
    db.pickupSlot.findMany({
      select: {
        id: true,
        label: true,
        capacity: true,
        _count: {
          select: {
            orders: { where: { status: { not: 'CANCELLED' } } },
          },
        },
      },
      orderBy: { startTime: 'asc' },
    }),
    db.order.count({ where: { reminderSent: false, status: 'PENDING' } }),
  ])

  const [total, pending, confirmed, cancelled] = orderCounts

  return {
    orders: { total, pending, confirmed, cancelled },
    slots: slots.map((slot) => ({
      id: slot.id,
      label: slot.label,
      orders: slot._count.orders,
      capacity: slot.capacity,
      occupancyPercent:
        slot.capacity !== null
          ? Math.round((slot._count.orders / slot.capacity) * 100)
          : null,
    })),
    remindersPending,
  }
}
