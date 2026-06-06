import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getOrdersPendingReminder, markReminderSent } from '@repo/database'
import { renderEmail } from '@repo/email'
import { sendEmail } from '@/lib/email'
import logger from '@/lib/logger'
import { getClubConfig } from '@/club.config'

export async function POST(request: NextRequest) {
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
    })
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ sent, failed })
}
