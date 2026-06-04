import { NextRequest, NextResponse } from 'next/server'
import { getOrders } from '@repo/database'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-export-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await getOrders({ status: 'CONFIRMED' })

  const rows: string[][] = [
    ['Bestellnummer', 'Name', 'E-Mail', 'Zeitslot', 'Produkt', 'Menge', 'Preis', 'Status'],
    ...orders.flatMap((order) =>
      order.items.map((item) => [
        order.id,
        order.customerName,
        order.email,
        order.pickupSlot.label,
        item.product.name,
        String(item.quantity),
        item.product.price.toString(),
        order.status,
      ])
    ),
  ]

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bestellungen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
