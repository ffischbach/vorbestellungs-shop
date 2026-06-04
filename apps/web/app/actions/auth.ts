'use server'

import { auth } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  if (!email || !password) {
    return { error: 'Bitte E-Mail und Passwort eingeben.' }
  }

  let response: Response
  try {
    response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
      headers: await headers(),
    })
  } catch {
    return { error: 'Verbindungsfehler. Bitte versuche es erneut.' }
  }

  if (!response.ok) {
    return { error: 'E-Mail oder Passwort falsch.' }
  }

  const data = await response.json() as { token?: string }
  if (!data.token) {
    return { error: 'Anmeldung fehlgeschlagen.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('better-auth.session_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()

  // Session-Token aus Cookie lesen und serverseitig invalidieren
  const allCookies = cookieStore.getAll()
  const sessionCookie = allCookies.find((c) => c.name.includes('session_token'))

  if (sessionCookie) {
    const headerValue = `${sessionCookie.name}=${sessionCookie.value}`
    try {
      await auth.api.signOut({
        headers: new Headers({ cookie: headerValue }),
        asResponse: true,
      })
    } catch {
      // Session war schon abgelaufen — ignorieren
    }
    cookieStore.delete(sessionCookie.name)
  }

  redirect('/admin/login')
}
