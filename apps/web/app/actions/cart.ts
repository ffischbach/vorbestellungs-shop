'use server'

import {
  upsertCartReservation,
  deleteCartReservation,
  deleteAllCartReservations,
  getCartItemsBySession,
} from '@repo/database'

export async function syncCartReservation(
  sessionId: string,
  productId: string,
  quantity: number
) {
  if (!sessionId || !productId) return
  if (quantity <= 0) {
    await deleteCartReservation(sessionId, productId)
  } else {
    await upsertCartReservation(sessionId, productId, quantity)
  }
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
