import { db, getHealthMetrics } from '@repo/database'
import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'
import { withRequestContext } from '@/lib/request-context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      await db.$queryRaw`SELECT 1`
    } catch (error) {
      logger.error({ error }, 'Database connection check failed')
      return NextResponse.json(
        { status: 'error', db: 'disconnected', timestamp: new Date().toISOString() },
        { status: 503 },
      )
    }

    const metrics = await getHealthMetrics().catch((error) => {
      logger.warn({ error }, 'Failed to collect health metrics')
      return null
    })

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
      ...(metrics !== null && { metrics }),
    })
  })
}
