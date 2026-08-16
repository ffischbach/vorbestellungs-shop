import { NextRequest, NextResponse } from 'next/server'
import { getOrdersPendingReminder, markReminderSent } from '@repo/database'
import { renderEmail } from '@repo/email'
import { sendEmail } from '@/lib/email'
import logger from '@/lib/logger'
import { withRequestContext } from '@/lib/request-context'
import { getClubConfig } from '@/club.config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    // INV-05: x-cron-secret ist die einheitliche Header-Konvention für alle
    // Cron-/Export-Routen — siehe docs/domain/invariants.md
    const secret = request.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [orders, clubConfig] = await Promise.all([
      getOrdersPendingReminder(tomorrow),
      getClubConfig(),
    ])
    logger.info({ count: orders.length }, 'Reminder-Mails werden versendet')

    const results = await Promise.allSettled(
      orders.map(async (order) => {
        const html = await renderEmail('order-reminder', {
          customerName: order.customerName,
          items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
          pickupSlot: { label: order.pickupSlot.label },
          clubName: clubConfig.name,
          eventDate: clubConfig.eventDate,
          contactEmail: clubConfig.contactEmail,
        })

        const result = await sendEmail({
          to: order.email,
          subject: `Erinnerung: Deine Abholung bei ${clubConfig.name}`,
          html,
        })

        if (result.success) {
          await markReminderSent(order.id)
        }

        return result
      }),
    )

    const sent = results.filter(
      (r): r is PromiseFulfilledResult<{ success: true; messageId: string }> =>
        r.status === 'fulfilled' && r.value.success,
    ).length
    const failed = results.length - sent

    if (failed > 0) {
      logger.warn({ sent, failed }, 'Einige Reminder-Mails konnten nicht versendet werden')
    } else {
      logger.info({ sent }, 'Reminder-Mails erfolgreich versendet')
    }

    return NextResponse.json({ sent, failed })
  })
}
