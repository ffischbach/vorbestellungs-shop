import { cookies } from 'next/headers'
import { db } from '@repo/database'

const SESSION_COOKIE = 'better-auth.session_token'

/**
 * Holt die aktuelle Session inkl. User direkt aus der Datenbank.
 *
 * Besser als `auth.api.getSession()` in Server Components, da Better Auth
 * intern `headers.get('cookie')` nicht zuverlässig auflösen kann
 * (Next.js 16 ReadonlyHeaders).
 */
export async function getSessionFromCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    return null
  }

  return session
}
