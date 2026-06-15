import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getOrders } from '@repo/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!(await auth.api.getSession({ headers: request.headers }))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orders = await getOrders({ status: 'CONFIRMED' })

  const rows: string[][] = [
    ['Bestellnummer', 'Name', 'E-Mail', 'Zeitslot', 'Produkt', 'Menge', 'Preis', 'Status'],
    ...orders.flatMap((order) =>
      order.items.map((item) => [
        order.orderNumber,
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

  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""')
          // Prevent formula injection in spreadsheet applications
          const safe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped
          return `"${safe}"`
        })
        .join(','),
    )
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bestellungen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
