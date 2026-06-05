'use server'

import { db } from '@repo/database'
import { auth } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'better-auth.session_token'

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

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

  const data = await response.json() as { token?: string; twoFactorRedirect?: boolean }

  if (data.twoFactorRedirect) {
    // 2FA-Cookie aus der Antwort an den Browser weitergeben
    const setCookieHeader = response.headers.get('set-cookie') ?? ''
    const twoFaCookiePart = setCookieHeader
      .split(',')
      .find((c) => c.includes('two_factor') || c.includes('two-factor'))

    if (twoFaCookiePart) {
      const [nameValue] = twoFaCookiePart.trim().split(';')
      const eqIdx = nameValue.indexOf('=')
      if (eqIdx !== -1) {
        const name = nameValue.slice(0, eqIdx).trim()
        const value = nameValue.slice(eqIdx + 1).trim()
        ;(await cookies()).set(name, value, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 600,
        })
      }
    }
    redirect('/admin/login/totp')
  }

  if (!data.token) {
    return { error: 'Anmeldung fehlgeschlagen.' }
  }

  ;(await cookies()).set(SESSION_COOKIE, data.token, sessionCookieOptions)
  redirect('/admin')
}

export async function verifyTotpLoginAction(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const code = formData.get('code')?.toString().trim() ?? ''

  if (!code) {
    return { error: 'Bitte Code eingeben.' }
  }

  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  let response: Response
  try {
    response = await auth.api.verifyTOTP({
      body: { code },
      headers: new Headers({ cookie: allCookies }),
      asResponse: true,
    })
  } catch {
    return { error: 'Ungültiger Code.' }
  }

  if (!response.ok) {
    return { error: 'Ungültiger Code.' }
  }

  const data = await response.json() as { token?: string }
  if (!data.token) {
    return { error: 'Anmeldung fehlgeschlagen.' }
  }

  cookieStore.set(SESSION_COOKIE, data.token, sessionCookieOptions)
  redirect('/admin')
}

export async function setupAdminAction(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const existing = await db.user.count()
  if (existing > 0) {
    return { error: 'Es existiert bereits ein Admin-Account.' }
  }

  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const name = formData.get('name')?.toString().trim() || 'Admin'

  if (!email || !password) {
    return { error: 'E-Mail und Passwort sind Pflicht.' }
  }

  if (password.length < 8) {
    return { error: 'Passwort muss mindestens 8 Zeichen haben.' }
  }

  const result = await auth.api.signUpEmail({ body: { email, password, name } })
  if (!result?.user) {
    return { error: 'Account konnte nicht erstellt werden.' }
  }

  redirect('/admin/login')
}

export type TotpSetupState =
  | null
  | { step: 'scan'; totpURI: string; backupCodes: string[] }
  | { error: string }

export async function initiateTotpSetupAction(
  _prevState: TotpSetupState,
  formData: FormData,
): Promise<TotpSetupState> {
  const password = formData.get('password')?.toString() ?? ''
  if (!password) return { error: 'Passwort ist Pflicht.' }

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionToken) return { error: 'Nicht angemeldet.' }

  let result: { totpURI: string; backupCodes: string[] }
  try {
    result = await auth.api.enableTwoFactor({
      body: { password },
      headers: new Headers({ cookie: `${SESSION_COOKIE}=${sessionToken}` }),
    }) as { totpURI: string; backupCodes: string[] }
  } catch {
    return { error: 'Passwort falsch oder 2FA konnte nicht aktiviert werden.' }
  }

  if (!result?.totpURI) return { error: '2FA-Setup fehlgeschlagen.' }

  return { step: 'scan', totpURI: result.totpURI, backupCodes: result.backupCodes }
}

export async function verifyTotpSetupAction(
  _prevState: TotpSetupState,
  formData: FormData,
): Promise<TotpSetupState> {
  const code = formData.get('code')?.toString().trim() ?? ''
  if (!code) return { error: 'Bitte Code eingeben.' }

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionToken) return { error: 'Nicht angemeldet.' }

  const session = await auth.api.getSession({
    headers: new Headers({ cookie: `${SESSION_COOKIE}=${sessionToken}` }),
  })
  if (!session?.user) return { error: 'Sitzung abgelaufen.' }

  let response: Response
  try {
    response = await auth.api.verifyTOTP({
      body: { code },
      headers: new Headers({ cookie: `${SESSION_COOKIE}=${sessionToken}` }),
      asResponse: true,
    })
  } catch {
    return { error: 'Ungültiger Code.' }
  }

  if (!response.ok) return { error: 'Ungültiger Code. Bitte erneut versuchen.' }

  // verifyTOTP rotiert die Session (altes Token gelöscht, neues in DB) — neues Token holen
  const newSession = await db.session.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { token: true },
  })

  if (newSession) {
    cookieStore.set(SESSION_COOKIE, newSession.token, sessionCookieOptions)
  }

  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
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
