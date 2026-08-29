import { randomUUID } from 'crypto'
import { db } from '../index'
import { Prisma, type OrderStatus } from '@prisma/client'

export async function getOrders(filters?: { status?: OrderStatus; date?: Date }) {
  let dateFilter: { pickupSlot: { startTime: { gte: Date; lt: Date } } } | undefined
  if (filters?.date) {
    const startOfDay = new Date(filters.date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(filters.date)
    endOfDay.setHours(23, 59, 59, 999)
    dateFilter = { pickupSlot: { startTime: { gte: startOfDay, lt: endOfDay } } }
  }

  return db.order.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...dateFilter,
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

export class SlotFullError extends Error {
  constructor() { super('SLOT_FULL') }
}
export class SlotNotFoundError extends Error {
  constructor() { super('SLOT_NOT_FOUND') }
}
export class ProductStockError extends Error {
  constructor(public readonly productId: string) { super('PRODUCT_STOCK_EXCEEDED') }
}

export async function createOrder(data: {
  customerName: string
  email: string
  pickupSlotId: string
  marketingConsent: boolean
  items: Array<{ productId: string; quantity: number; price: number }>
}) {
  return db.$transaction(async (tx) => {
    const slot = await tx.pickupSlot.findUnique({
      where: { id: data.pickupSlotId },
      select: { capacity: true },
    })

    if (!slot) throw new SlotNotFoundError()

    if (slot.capacity !== null) {
      const activeCount = await tx.order.count({
        where: { pickupSlotId: data.pickupSlotId, status: { not: 'CANCELLED' } },
      })
      if (activeCount >= slot.capacity) throw new SlotFullError()
    }

    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true },
      })
      if (product?.stock !== null && product?.stock !== undefined) {
        const soldResult = await tx.orderItem.aggregate({
          where: { productId: item.productId, order: { status: { not: 'CANCELLED' } } },
          _sum: { quantity: true },
        })
        const sold = soldResult._sum.quantity ?? 0
        if (sold + item.quantity > product.stock) throw new ProductStockError(item.productId)
      }
    }

    const id = randomUUID()
    const orderNumber = `VB-${id.slice(-6).toUpperCase()}`

    return tx.order.create({
      data: {
        id,
        orderNumber,
        customerName: data.customerName,
        email: data.email,
        pickupSlotId: data.pickupSlotId,
        marketingConsent: data.marketingConsent,
        marketingConsentAt: data.marketingConsent ? new Date() : null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        pickupSlot: true,
      },
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
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

export async function getMarketingConsentEmails() {
  return db.order.findMany({
    where: { marketingConsent: true, status: { not: 'CANCELLED' } },
    select: { customerName: true, email: true, orderNumber: true, marketingConsentAt: true },
    orderBy: { marketingConsentAt: 'desc' },
  })
}

export async function getOrderStats() {
  const [total, pending, confirmed, cancelled, confirmedItems] = await Promise.all([
    db.order.count(),
    db.order.count({ where: { status: 'PENDING' } }),
    db.order.count({ where: { status: 'CONFIRMED' } }),
    db.order.count({ where: { status: 'CANCELLED' } }),
    // INV-02: Preis-Snapshot (item.price), nicht Product.price — siehe docs/domain/invariants.md
    db.orderItem.findMany({
      where: { order: { status: 'CONFIRMED' } },
      select: { price: true, quantity: true },
    }),
  ])
  const totalRevenue = confirmedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
  return { total, pending, confirmed, cancelled, totalRevenue }
}
