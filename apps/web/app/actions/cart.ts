'use server'

import {
  upsertCartReservation,
  deleteCartReservation,
  deleteAllCartReservations,
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
