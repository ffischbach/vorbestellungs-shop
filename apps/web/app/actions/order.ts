'use server'

import { z } from 'zod'
import {
  createOrder,
  getProducts,
  SlotFullError,
  SlotNotFoundError,
  ProductStockError,
  deleteAllCartReservations,
} from '@repo/database'
import { evaluateRules } from '@/lib/validation/evaluate'
import { renderEmail } from '@repo/email'
import { sendEmail } from '@/lib/email'
import { getClubConfig } from '@/club.config'
import logger from '@/lib/logger'

const orderInputSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
  pickupSlotId: z.string().min(1),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) }))
    .min(1),
})

export type SubmitOrderResult =
  | { success: true; orderId: string; orderNumber: string }
  | { success: false; error: string }

export async function submitOrder(input: unknown, sessionId?: string): Promise<SubmitOrderResult> {
  const parsed = orderInputSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'INVALID_INPUT' }
  }

  const { customerName, email, pickupSlotId, items } = parsed.data

  const allProducts = await getProducts()
  const productMap = new Map(allProducts.map((p) => [p.id, p]))

  const resolvedItems: Array<{ productId: string; quantity: number; price: number }> = []
  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) return { success: false, error: 'PRODUCT_NOT_FOUND' }
    resolvedItems.push({ productId: item.productId, quantity: item.quantity, price: Number(product.price) })
  }

  const orderContext = {
    pickupSlotId,
    items: items.map((item) => {
      const product = productMap.get(item.productId)!
      return {
        productId: item.productId,
        categoryId: product.categoryId,
        quantity: item.quantity,
        allowedSlotIds: product.allowedSlots.map((s) => s.id),
      }
    }),
  }

  // TODO: load rules from DB when ValidationRule model is added
  const results = evaluateRules([], orderContext)
  const violation = results.find((r) => !r.valid)
  if (violation && !violation.valid) {
    return { success: false, error: violation.message }
  }

  let order
  try {
    order = await createOrder({ customerName, email, pickupSlotId, items: resolvedItems })
  } catch (err) {
    if (err instanceof SlotFullError) return { success: false, error: 'SLOT_FULL' }
    if (err instanceof SlotNotFoundError) return { success: false, error: 'SLOT_NOT_FOUND' }
    if (err instanceof ProductStockError) return { success: false, error: 'PRODUCT_STOCK_EXCEEDED' }
    throw err
  }

  const orderNumber = `VB-${order.id.slice(-6).toUpperCase()}`

  const clubConfig = await getClubConfig()

  const emailHtml = await renderEmail('order-confirmation', {
    orderNumber,
    customerName,
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: Number(item.price),
    })),
    pickupSlot: {
      label: order.pickupSlot.label,
      startTime: order.pickupSlot.startTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      endTime: order.pickupSlot.endTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    clubName: clubConfig.name,
    contactEmail: clubConfig.contactEmail,
  })

  if (sessionId) {
    await deleteAllCartReservations(sessionId)
  }

  const emailResult = await sendEmail({
    to: email,
    subject: `Bestellbestätigung #${orderNumber} – ${clubConfig.name}`,
    html: emailHtml,
  })
  if (!emailResult.success) {
    logger.warn({ orderId: order.id, orderNumber }, 'Bestellung gespeichert, E-Mail-Versand fehlgeschlagen')
  }

  return { success: true, orderId: order.id, orderNumber }
}
