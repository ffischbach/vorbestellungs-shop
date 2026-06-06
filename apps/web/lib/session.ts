import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function getSessionFromCookie() {
  return auth.api.getSession({ headers: await headers() })
}
