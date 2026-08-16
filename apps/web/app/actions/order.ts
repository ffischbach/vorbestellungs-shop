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
import { runWithSessionId } from '@/lib/request-context'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const orderInputSchema = z.object({
  customerName: z.string().min(1),
  email: z.string().email(),
  pickupSlotId: z.string().min(1),
  marketingConsent: z.boolean().optional().default(false),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1) }))
    .min(1),
})

export type SubmitOrderResult =
  | { success: true; orderId: string; orderNumber: string }
  | { success: false; error: string }

export async function submitOrder(input: unknown, sessionId?: string): Promise<SubmitOrderResult> {
  const ip = (await headers()).get('x-real-ip') ?? 'unknown'
  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    logger.warn({ ip }, 'Bestellung rate-limited')
    return { success: false, error: 'RATE_LIMITED' }
  }

  return runWithSessionId(sessionId ?? '', async () => {
    const parsed = orderInputSchema.safeParse(input)
    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'Bestellformular ungültig')
      return { success: false, error: 'INVALID_INPUT' }
    }

    const { customerName, email, pickupSlotId, marketingConsent, items } = parsed.data

    logger.info(
      { pickupSlotId, itemCount: items.length },
      'Bestellung wird verarbeitet',
    )

    const allProducts = await getProducts()
    const productMap = new Map(allProducts.map((p) => [p.id, p]))

    const resolvedItems: Array<{ productId: string; quantity: number; price: number }> = []
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        logger.warn({ productId: item.productId }, 'Unbekanntes Produkt bei Bestellung')
        return { success: false, error: 'PRODUCT_NOT_FOUND' }
      }
      // INV-02: Preis wird hier als Snapshot festgehalten — siehe docs/domain/invariants.md
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

    // INV-07: hartcodierte leere Regelliste — evaluateRules() greift aktuell nie.
    // TODO: load rules from DB when ValidationRule model is added, siehe docs/domain/invariants.md
    const results = evaluateRules([], orderContext)
    const violation = results.find((r) => !r.valid)
    if (violation && !violation.valid) {
      logger.warn({ pickupSlotId, violation: violation.message }, 'Bestellung durch Validierungsregel abgelehnt')
      return { success: false, error: violation.message }
    }

    let order
    try {
      order = await createOrder({ customerName, email, pickupSlotId, marketingConsent, items: resolvedItems })
    } catch (err) {
      if (err instanceof SlotFullError) {
        logger.warn({ pickupSlotId }, 'Bestellung abgelehnt: Slot ausgebucht')
        return { success: false, error: 'SLOT_FULL' }
      }
      if (err instanceof SlotNotFoundError) {
        logger.warn({ pickupSlotId }, 'Bestellung abgelehnt: Slot nicht gefunden')
        return { success: false, error: 'SLOT_NOT_FOUND' }
      }
      if (err instanceof ProductStockError) {
        logger.warn({ productId: err.productId }, 'Bestellung abgelehnt: Lagerbestand überschritten')
        return { success: false, error: 'PRODUCT_STOCK_EXCEEDED' }
      }
      logger.error({ pickupSlotId, err }, 'Unerwarteter Fehler beim Erstellen der Bestellung')
      throw err
    }

    const orderNumber = order.orderNumber

    logger.info(
      { orderId: order.id, orderNumber, pickupSlotId, itemCount: resolvedItems.length },
      'Bestellung erfolgreich erstellt',
    )

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
      qrCodeUrl: `${process.env.BETTER_AUTH_URL}/api/qr?data=${encodeURIComponent(orderNumber)}`,
    })

    if (sessionId) {
      await deleteAllCartReservations(sessionId)
    }

    const emailResult = await sendEmail({
      to: email,
      subject: `Bestellbestätigung #${orderNumber} – ${clubConfig.name}`,
      html: emailHtml,
    })

    if (emailResult.success) {
      logger.info({ orderId: order.id, orderNumber }, 'Bestätigungsmail versendet')
    } else {
      logger.warn({ orderId: order.id, orderNumber }, 'Bestellung gespeichert, E-Mail-Versand fehlgeschlagen')
    }

    return { success: true, orderId: order.id, orderNumber }
  })
}
