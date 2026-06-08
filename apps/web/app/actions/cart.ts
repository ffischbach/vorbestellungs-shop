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
import logger from '@/lib/logger'
import { runWithSessionId } from '@/lib/request-context'

export async function syncCartReservation(
  sessionId: string,
  productId: string,
  quantity: number
): Promise<{ success: true } | { success: false; error: string }> {
  if (!sessionId || !productId) return { success: true }

  return runWithSessionId(sessionId, async () => {
    if (quantity <= 0) {
      await deleteCartReservation(sessionId, productId)
      logger.info({ productId }, 'Produkt aus Warenkorb entfernt')
      return { success: true }
    }

    const product = await getProductById(productId)
    if (!product) return { success: false, error: 'PRODUCT_NOT_FOUND' }
    if (!product.available) {
      logger.warn({ productId }, 'Produkt nicht verfügbar')
      return { success: false, error: 'PRODUCT_UNAVAILABLE' }
    }

    if (product.stock !== null) {
      const [soldQuantities, reservedByOthers] = await Promise.all([
        getProductSoldQuantities(),
        getReservedQuantitiesByOthers(sessionId),
      ])
      const sold = soldQuantities[productId] ?? 0
      const reserved = reservedByOthers[productId] ?? 0
      const available = product.stock - sold - reserved
      if (quantity > available) {
        logger.warn({ productId, requested: quantity, available }, 'Produkt nicht ausreichend auf Lager')
        return { success: false, error: 'OUT_OF_STOCK' }
      }
    }

    await upsertCartReservation(sessionId, productId, quantity)
    logger.info({ productId, quantity }, 'Produkt in Warenkorb gelegt')
    return { success: true }
  })
}

export async function clearAllCartReservations(sessionId: string) {
  if (!sessionId) return
  return runWithSessionId(sessionId, async () => {
    await deleteAllCartReservations(sessionId)
    logger.info('Warenkorb geleert')
  })
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
