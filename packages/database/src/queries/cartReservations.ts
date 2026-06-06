import { db } from '../index'

const RESERVATION_TTL_MS = 30 * 60 * 1000

function reservationExpiry(): Date {
  return new Date(Date.now() + RESERVATION_TTL_MS)
}

export async function upsertCartReservation(sessionId: string, productId: string, quantity: number) {
  return db.cartReservation.upsert({
    where: { sessionId_productId: { sessionId, productId } },
    update: { quantity, expiresAt: reservationExpiry() },
    create: { sessionId, productId, quantity, expiresAt: reservationExpiry() },
  })
}

export async function deleteCartReservation(sessionId: string, productId: string) {
  return db.cartReservation.deleteMany({ where: { sessionId, productId } })
}

export async function deleteAllCartReservations(sessionId: string) {
  return db.cartReservation.deleteMany({ where: { sessionId } })
}

export async function getReservedQuantitiesByOthers(
  excludeSessionId?: string
): Promise<Record<string, number>> {
  const rows = await db.cartReservation.groupBy({
    by: ['productId'],
    where: {
      expiresAt: { gt: new Date() },
      ...(excludeSessionId ? { sessionId: { not: excludeSessionId } } : {}),
    },
    _sum: { quantity: true },
  })
  return Object.fromEntries(rows.map((r) => [r.productId, r._sum.quantity ?? 0]))
}

export async function cleanupExpiredReservations() {
  return db.cartReservation.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}

export async function getCartItemsBySession(sessionId: string) {
  const reservations = await db.cartReservation.findMany({
    where: { sessionId, expiresAt: { gt: new Date() } },
    include: {
      product: {
        include: { allowedSlots: { select: { id: true } } },
      },
    },
  })
  return reservations.map((r) => ({
    productId: r.productId,
    quantity: r.quantity,
    name: r.product.name,
    price: Number(r.product.price),
    imageUrl: r.product.imageUrl ?? undefined,
    allowedSlotIds: r.product.allowedSlots.map((s) => s.id),
  }))
}
