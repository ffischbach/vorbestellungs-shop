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
    ['order_id', 'first_name', 'last_name', 'email', 'abholzeit', 'net_total', 'item_name', 'quantity'],
    ...orders.flatMap((order) => {
      const nameParts = order.customerName.trim().split(/\s+/)
      const firstName = nameParts[0] ?? ''
      const lastName = nameParts.slice(1).join(' ')
      const orderId = String(parseInt(order.orderNumber.slice(3), 16))
      const netTotal = order.items
        .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
        .toFixed(2)
      return order.items.map((item) => [
        orderId,
        firstName,
        lastName,
        order.email,
        order.pickupSlot.label,
        netTotal,
        item.product.name,
        String(item.quantity),
      ])
    }),
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
