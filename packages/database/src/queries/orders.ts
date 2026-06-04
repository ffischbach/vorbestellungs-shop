import { db } from '../index'
import type { OrderStatus } from '@prisma/client'

export async function getOrders(filters?: { status?: OrderStatus; date?: Date }) {
  return db.order.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.date && {
        pickupSlot: {
          startTime: {
            gte: new Date(filters.date.setHours(0, 0, 0, 0)),
            lt: new Date(filters.date.setHours(23, 59, 59, 999)),
          },
        },
      }),
    },
    include: {
      items: { include: { product: { include: { category: true } } } },
      pickupSlot: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrderById(id: string) {
  return db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { category: true } } } },
      pickupSlot: true,
    },
  })
}

export async function createOrder(data: {
  customerName: string
  email: string
  pickupSlotId: string
  items: Array<{ productId: string; quantity: number }>
}) {
  return db.order.create({
    data: {
      customerName: data.customerName,
      email: data.email,
      pickupSlotId: data.pickupSlotId,
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
      pickupSlot: true,
    },
  })
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return db.order.update({ where: { id }, data: { status } })
}

export async function getOrdersPendingReminder(eventDate: Date) {
  const start = new Date(eventDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(eventDate)
  end.setHours(23, 59, 59, 999)

  return db.order.findMany({
    where: {
      reminderSent: false,
      status: 'PENDING',
      pickupSlot: { startTime: { gte: start, lte: end } },
    },
    include: {
      items: { include: { product: true } },
      pickupSlot: true,
    },
  })
}

export async function markReminderSent(id: string) {
  return db.order.update({ where: { id }, data: { reminderSent: true } })
}
