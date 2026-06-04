import { db } from '../index'

export async function getProducts() {
  return db.product.findMany({
    where: { available: true },
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

export async function createProduct(data: {
  name: string
  description?: string
  price: number
  imageUrl?: string
  maxQuantity?: number
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
