import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredReservations } from '@repo/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await cleanupExpiredReservations()
  return NextResponse.json({ deleted: result.count })
}
