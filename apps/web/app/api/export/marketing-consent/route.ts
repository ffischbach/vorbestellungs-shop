import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getMarketingConsentEmails } from '@repo/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  if (!(await auth.api.getSession({ headers: request.headers }))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await getMarketingConsentEmails()

  const csvRows: string[][] = [
    ['Name', 'E-Mail', 'Bestellnummer', 'Einwilligung am'],
    ...rows.map((row) => [
      row.customerName,
      row.email,
      row.orderNumber,
      row.marketingConsentAt?.toISOString() ?? '',
    ]),
  ]

  const csv = csvRows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = cell.replace(/"/g, '""')
          const safe = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped
          return `"${safe}"`
        })
        .join(','),
    )
    .join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="marketing-einwilligungen-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
