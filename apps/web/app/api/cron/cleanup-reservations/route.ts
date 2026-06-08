import { NextRequest, NextResponse } from 'next/server'
import { cleanupExpiredReservations } from '@repo/database'
import logger from '@/lib/logger'
import { withRequestContext } from '@/lib/request-context'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    const secret = request.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await cleanupExpiredReservations()
    logger.info({ deleted: result.count }, 'Reservierungen bereinigt')

    return NextResponse.json({ deleted: result.count })
  })
}
