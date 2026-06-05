'use server'

import { db } from '@repo/database'
import { auth } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import logger from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'

const SESSION_COOKIE = 'better-auth.session_token'

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = h.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

async function getUserAgent(): Promise<string> {
  return (await headers()).get('user-agent') ?? 'unknown'
}

// =============================================================================
// Rate Limiting
// =============================================================================

function assertRateLimit(key: string): { error: string } | null {
  const result = checkRateLimit(key)
  if (!result.allowed) {
    const minutes = Math.ceil(result.resetInSeconds / 60)
    return { error: `Zu viele Versuche. Bitte in ${minutes} Minuten erneut versuchen.` }
  }
  return null
}

// =============================================================================
// Login
// =============================================================================

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const ip = await getClientIp()
  const ua = await getUserAgent()

  const authLogger = logger.child({ event: 'login', email, ip, ua })

  if (!email || !password) {
    authLogger.warn('login_attempt_missing_credentials')
    return { error: 'Bitte E-Mail und Passwort eingeben.' }
  }

  // Rate Limit pro E-Mail + IP Kombination
  const rateLimitKey = `login:${email.toLowerCase()}:${ip}`
  const rateLimitError = assertRateLimit(rateLimitKey)
  if (rateLimitError) {
    authLogger.warn({ rateLimitKey }, 'login_rate_limited')
    return rateLimitError
  }

  let response: Response
  try {
    response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
      headers: await headers(),
    })
  } catch (err: any) {
    authLogger.error({ errStatus: err?.status ?? 'unknown', errMessage: err?.message ?? String(err) }, 'login_error')
    return { error: 'Verbindungsfehler. Bitte versuche es erneut.' }
  }

  if (!response.ok) {
    authLogger.warn({ status: response.status }, 'login_failure')
    return { error: 'E-Mail oder Passwort falsch.' }
  }

  const data = await response.json() as { token?: string; twoFactorRedirect?: boolean }

  if (data.twoFactorRedirect) {
    authLogger.info('login_success_2fa_pending')

    // 2FA-Pending-Cookie aus der Antwort an den Browser weitergeben.
    // getSetCookie() gibt ein string[] zurück (ein Eintrag pro Cookie) und
    // vermeidet das Problem mit Kommas in Expires-Werten beim split(',').
    const setCookies = response.headers.getSetCookie?.() ??
      response.headers.get('set-cookie')?.split(/,\s*(?=[a-zA-Z0-9_-]+=)/) ?? []

    const twoFaCookieStr = setCookies.find(
      (c) => c.includes('two_factor') || c.includes('two-factor'),
    )

    if (twoFaCookieStr) {
      const [nameValue] = twoFaCookieStr.trim().split(';')
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
    authLogger.error('login_missing_token')
    return { error: 'Anmeldung fehlgeschlagen.' }
  }

  authLogger.info('login_success')
  ;(await cookies()).set(SESSION_COOKIE, data.token, sessionCookieOptions)
  redirect('/admin')
}

// =============================================================================
// TOTP Login
// =============================================================================

export async function verifyTotpLoginAction(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const code = formData.get('code')?.toString().trim() ?? ''
  const ip = await getClientIp()
  const ua = await getUserAgent()

  const authLogger = logger.child({ event: 'totp_login', ip, ua })

  if (!code) {
    return { error: 'Bitte Code eingeben.' }
  }

  // Rate Limit pro IP
  const rateLimitKey = `totp:${ip}`
  const rateLimitError = assertRateLimit(rateLimitKey)
  if (rateLimitError) {
    authLogger.warn({ rateLimitKey }, 'totp_login_rate_limited')
    return rateLimitError
  }

  let response: Response
  try {
    response = await auth.api.verifyTOTP({
      body: { code },
      headers: await headers(),
      asResponse: true,
    })
  } catch (err: any) {
    authLogger.error({ errStatus: err?.status ?? 'unknown', errMessage: err?.message ?? String(err) }, 'totp_login_error')
    return { error: 'Ungültiger Code.' }
  }

  if (!response.ok) {
    authLogger.warn({ status: response.status }, 'totp_login_failure')
    return { error: 'Ungültiger Code.' }
  }

  const data = await response.json() as { token?: string }
  if (!data.token) {
    authLogger.error('totp_login_missing_token')
    return { error: 'Anmeldung fehlgeschlagen.' }
  }

  authLogger.info('totp_login_success')
  ;(await cookies()).set(SESSION_COOKIE, data.token, sessionCookieOptions)
  redirect('/admin')
}

// =============================================================================
// Admin Setup
// =============================================================================

export async function setupAdminAction(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const ip = await getClientIp()
  const ua = await getUserAgent()
  const authLogger = logger.child({ event: 'admin_setup', ip, ua })

  const existing = await db.user.count()
  if (existing > 0) {
    authLogger.warn('admin_setup_rejected_existing_user')
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
    authLogger.error({ email }, 'admin_setup_failure')
    return { error: 'Account konnte nicht erstellt werden.' }
  }

  authLogger.info({ email }, 'admin_setup_success')
  redirect('/admin/login')
}

// =============================================================================
// TOTP Setup
// =============================================================================

export type TotpSetupState =
  | null
  | { step: 'scan'; totpURI: string; backupCodes: string[] }
  | { error: string }

export async function initiateTotpSetupAction(
  _prevState: TotpSetupState,
  formData: FormData,
): Promise<TotpSetupState> {
  const password = formData.get('password')?.toString() ?? ''
  const ip = await getClientIp()
  const authLogger = logger.child({ event: 'totp_setup_initiate', ip })

  if (!password) return { error: 'Passwort ist Pflicht.' }

  let result: { totpURI: string; backupCodes: string[] }
  try {
    result = await auth.api.enableTwoFactor({
      body: { password },
      headers: await headers(),
    }) as { totpURI: string; backupCodes: string[] }
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode ?? 'unknown'
    const message = err?.message ?? String(err)
    authLogger.error({ errStatus: status, errMessage: message }, 'totp_setup_initiate_error')
    return { error: 'Passwort falsch oder 2FA konnte nicht aktiviert werden.' }
  }

  if (!result?.totpURI) {
    authLogger.error('totp_setup_initiate_missing_uri')
    return { error: '2FA-Setup fehlgeschlagen.' }
  }

  authLogger.info('totp_setup_initiate_success')
  return { step: 'scan', totpURI: result.totpURI, backupCodes: result.backupCodes }
}

export async function verifyTotpSetupAction(
  _prevState: TotpSetupState,
  formData: FormData,
): Promise<TotpSetupState> {
  const code = formData.get('code')?.toString().trim() ?? ''
  const ip = await getClientIp()
  const authLogger = logger.child({ event: 'totp_setup_verify', ip })

  if (!code) return { error: 'Bitte Code eingeben.' }

  const requestHeaders = await headers()

  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session?.user) {
    authLogger.warn('totp_setup_verify_session_expired')
    return { error: 'Sitzung abgelaufen.' }
  }

  let response: Response
  try {
    response = await auth.api.verifyTOTP({
      body: { code },
      headers: requestHeaders,
      asResponse: true,
    })
  } catch (err: any) {
    const status = err?.status ?? err?.statusCode ?? 'unknown'
    const message = err?.message ?? String(err)
    authLogger.error({ errStatus: status, errMessage: message }, 'totp_setup_verify_error')
    return { error: 'Ungültiger Code.' }
  }

  if (!response.ok) {
    authLogger.warn({ status: response.status }, 'totp_setup_verify_failure')
    return { error: 'Ungültiger Code. Bitte erneut versuchen.' }
  }

  // Wenn verifyTOTP ein neues Session-Token zurückgibt (Session-Rotation nach Setup),
  // Cookie aktualisieren — andernfalls bleibt das bestehende Cookie gültig.
  const data = await response.json() as { token?: string }
  if (data?.token) {
    ;(await cookies()).set(SESSION_COOKIE, data.token, sessionCookieOptions)
  }

  authLogger.info({ userId: session.user.id }, 'totp_setup_verify_success')
  redirect('/admin')
}

// =============================================================================
// Logout
// =============================================================================

export async function logoutAction(): Promise<void> {
  const ip = await getClientIp()
  const ua = await getUserAgent()
  const authLogger = logger.child({ event: 'logout', ip, ua })

  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const sessionCookie = allCookies.find((c) => c.name.includes('session_token'))

  if (sessionCookie) {
    const headerValue = `${sessionCookie.name}=${sessionCookie.value}`
    try {
      // Better Auth signOut invalidiert die Session serverseitig
      await auth.api.signOut({
        headers: new Headers({ cookie: headerValue }),
        asResponse: true,
      })
      authLogger.info('logout_success')
    } catch (err) {
      // Session war schon abgelaufen — trotzdem Cookie löschen
      authLogger.warn({ err }, 'logout_session_already_expired')
    }

    // Cookie clientseitig löschen
    cookieStore.delete(sessionCookie.name)
  } else {
    authLogger.warn('logout_no_session_cookie')
  }

  redirect('/admin/login')
}
