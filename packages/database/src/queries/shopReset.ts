import { db } from '../index'

export type ShopResetCounts = {
  categories: number
  slots: number
  products: number
  orders: number
}

export async function getShopResetCounts(): Promise<ShopResetCounts> {
  const [categories, slots, products, orders] = await Promise.all([
    db.category.count(),
    db.pickupSlot.count(),
    db.product.count(),
    db.order.count(),
  ])
  return { categories, slots, products, orders }
}

export type ShopResetSummary = ShopResetCounts & { productImageUrls: string[] }

// Löscht ausschließlich Katalog- und Bestelldaten — User/Session/Account/ClubConfig
// bleiben erhalten, damit der Admin eingeloggt bleibt und Branding nicht verloren geht.
export async function resetShopData(): Promise<ShopResetSummary> {
  return db.$transaction(async (tx) => {
    const [categories, slots, products, orders, productImages] = await Promise.all([
      tx.category.count(),
      tx.pickupSlot.count(),
      tx.product.count(),
      tx.order.count(),
      tx.product.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } }),
    ])

    await tx.orderItem.deleteMany()
    await tx.order.deleteMany()
    await tx.cartReservation.deleteMany()
    await tx.product.deleteMany()
    await tx.pickupSlot.deleteMany()
    await tx.category.deleteMany()

    return {
      categories,
      slots,
      products,
      orders,
      productImageUrls: productImages.map((p) => p.imageUrl!).filter(Boolean),
    }
  })
}
