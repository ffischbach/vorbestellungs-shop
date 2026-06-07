'use server'

import {
  upsertCartReservation,
  deleteCartReservation,
  deleteAllCartReservations,
  getCartItemsBySession,
  getReservedQuantitiesByOthers,
  getProductById,
  getProductSoldQuantities,
} from '@repo/database'

export async function syncCartReservation(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<{ success: true } | { success: false; error: string }> {
  if (!sessionId || !productId) return { success: true }

  if (quantity <= 0) {
    await deleteCartReservation(sessionId, productId)
    return { success: true }
  }

  const product = await getProductById(productId)
  if (!product) return { success: false, error: 'PRODUCT_NOT_FOUND' }
  if (!product.available) return { success: false, error: 'PRODUCT_UNAVAILABLE' }

  if (product.stock !== null) {
    const [soldQuantities, reservedByOthers] = await Promise.all([
      getProductSoldQuantities(),
      getReservedQuantitiesByOthers(sessionId),
    ])
    const sold = soldQuantities[productId] ?? 0
    const reserved = reservedByOthers[productId] ?? 0
    const available = product.stock - sold - reserved
    if (quantity > available) {
      return { success: false, error: 'OUT_OF_STOCK' }
    }
  }

  await upsertCartReservation(sessionId, productId, quantity)
  return { success: true }
}

export async function clearAllCartReservations(sessionId: string) {
  if (!sessionId) return
  await deleteAllCartReservations(sessionId)
}

export async function fetchCartItems(sessionId: string): Promise<
  | { success: true; data: Awaited<ReturnType<typeof getCartItemsBySession>> }
  | { success: false; error: string }
> {
  if (!sessionId) return { success: true, data: [] }
  try {
    const data = await getCartItemsBySession(sessionId)
    return { success: true, data }
  } catch {
    return { success: false, error: 'FETCH_FAILED' }
  }
}
