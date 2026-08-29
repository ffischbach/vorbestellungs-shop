import { db } from '../index'

export async function getProducts() {
  return db.product.findMany({
    where: { available: true },
    include: { category: true, allowedSlots: true },
    orderBy: { name: 'asc' },
  })
}

// Für den Admin-Bereich: zeigt auch deaktivierte Produkte, damit sie wieder
// reaktivierbar bleiben. getProducts() (nur available: true) bleibt für den Shop.
export async function getAllProducts() {
  return db.product.findMany({
    include: { category: true, allowedSlots: true },
    orderBy: { name: 'asc' },
  })
}

export async function getProductById(id: string) {
  return db.product.findUnique({
    where: { id },
    include: { category: true, allowedSlots: true },
  })
}

export async function getProductSoldQuantities(): Promise<Record<string, number>> {
  const rows = await db.orderItem.groupBy({
    by: ['productId'],
    where: { order: { status: { not: 'CANCELLED' } } },
    _sum: { quantity: true },
  })
  return Object.fromEntries(rows.map((r) => [r.productId, r._sum.quantity ?? 0]))
}

export async function createProduct(data: {
  name: string
  description?: string
  price: number
  imageUrl?: string
  maxQuantity?: number
  stock?: number
  categoryId: string
  allowedSlotIds: string[]
}) {
  const { allowedSlotIds, ...rest } = data
  return db.product.create({
    data: {
      ...rest,
      allowedSlots: { connect: allowedSlotIds.map((id) => ({ id })) },
    },
    include: { category: true, allowedSlots: true },
  })
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string
    description: string
    price: number
    imageUrl: string
    available: boolean
    maxQuantity: number
    stock: number | null
    categoryId: string
    allowedSlotIds: string[]
  }>
) {
  const { allowedSlotIds, ...rest } = data
  return db.product.update({
    where: { id },
    data: {
      ...rest,
      ...(allowedSlotIds !== undefined && {
        allowedSlots: { set: allowedSlotIds.map((slotId) => ({ id: slotId })) },
      }),
    },
    include: { category: true, allowedSlots: true },
  })
}

export async function deleteProduct(id: string) {
  return db.product.delete({ where: { id } })
}
