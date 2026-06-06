'use server'

import { db } from '@repo/database'
import { auth } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import logger from '@/lib/logger'
import { checkRateLimit } from '@/lib/rate-limit'
import { hashPassword } from '@better-auth/utils/password'

async function getClientIp(): Promise<string> {
  const h = await headers()
  // x-real-ip is set by Caddy to the actual client IP and cannot be spoofed
  const realIp = h.get('x-real-ip')
  if (realIp) return realIp
  // Fallback: rightmost entry in X-Forwarded-For is set by the nearest trusted proxy
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',').at(-1)!.trim()
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

  const rateLimitKey = `login:${email.toLowerCase()}:${ip}`
  const rateLimitError = assertRateLimit(rateLimitKey)
  if (rateLimitError) {
    authLogger.warn({ rateLimitKey }, 'login_rate_limited')
    return rateLimitError
  }

  let result: { twoFactorRedirect?: boolean } | null
  try {
    // nextCookies plugin automatically sets the signed session (or 2FA pending) cookie.
    result = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    }) as { twoFactorRedirect?: boolean } | null
  } catch (err) {
    const e = err as { status?: unknown; message?: string }
    const status = e?.status ?? 'unknown'
    if (status === 'UNAUTHORIZED' || status === 401) {
      authLogger.warn({ status }, 'login_failure')
      return { error: 'E-Mail oder Passwort falsch.' }
    }
    authLogger.error({ errStatus: status, errMessage: e?.message ?? String(err) }, 'login_error')
    return { error: 'Verbindungsfehler. Bitte versuche es erneut.' }
  }

  if (result?.twoFactorRedirect) {
    authLogger.info('login_success_2fa_pending')
    redirect('/admin/login/totp')
  }

  authLogger.info('login_success')
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

  const rateLimitKey = `totp:${ip}`
  const rateLimitError = assertRateLimit(rateLimitKey)
  if (rateLimitError) {
    authLogger.warn({ rateLimitKey }, 'totp_login_rate_limited')
    return rateLimitError
  }

  try {
    // nextCookies plugin sets the signed session cookie on success.
    await auth.api.verifyTOTP({
      body: { code },
      headers: await headers(),
    })
  } catch (err) {
    const e = err as { status?: unknown; message?: string }
    authLogger.warn({ errStatus: e?.status ?? 'unknown' }, 'totp_login_failure')
    return { error: 'Ungültiger Code.' }
  }

  authLogger.info('totp_login_success')
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

  const email = formData.get('email')?.toString().trim() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const name = formData.get('name')?.toString().trim() || 'Admin'

  if (!email || !password) {
    return { error: 'E-Mail und Passwort sind Pflicht.' }
  }

  if (password.length < 8) {
    return { error: 'Passwort muss mindestens 8 Zeichen haben.' }
  }

  // Direkt in DB anlegen — umgeht disableSignUp ohne Env-Var-Workaround.
  // Count-Check und Create in einer Transaktion, um TOCTOU-Race zu verhindern.
  const userId = crypto.randomUUID()
  const now = new Date()
  const hashed = await hashPassword(password)
  let alreadyExists = false
  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.user.count()
      if (existing > 0) {
        alreadyExists = true
        return
      }
      await tx.user.create({
        data: { id: userId, name, email, emailVerified: false, createdAt: now, updatedAt: now },
      })
      await tx.account.create({
        data: {
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: 'credential',
          userId,
          password: hashed,
          createdAt: now,
          updatedAt: now,
        },
      })
    })
  } catch {
    authLogger.error({ email }, 'admin_setup_failure')
    return { error: 'Account konnte nicht erstellt werden.' }
  }

  if (alreadyExists) {
    authLogger.warn('admin_setup_rejected_existing_user')
    return { error: 'Es existiert bereits ein Admin-Account.' }
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
  } catch (err) {
    const e = err as { status?: unknown; statusCode?: unknown; message?: string }
    authLogger.error(
      { errStatus: e?.status ?? e?.statusCode ?? 'unknown', errMessage: e?.message ?? String(err) },
      'totp_setup_initiate_error',
    )
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

  try {
    // nextCookies plugin rotates the signed session cookie on success.
    await auth.api.verifyTOTP({
      body: { code },
      headers: requestHeaders,
    })
  } catch (err) {
    const e = err as { status?: unknown; statusCode?: unknown; message?: string }
    authLogger.error(
      { errStatus: e?.status ?? e?.statusCode ?? 'unknown', errMessage: e?.message ?? String(err) },
      'totp_setup_verify_error',
    )
    return { error: 'Ungültiger Code.' }
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

  try {
    // nextCookies plugin clears the session cookie via the signOut response headers.
    await auth.api.signOut({ headers: await headers() })
    authLogger.info('logout_success')
  } catch (err) {
    // Session already expired — clear the cookie manually as a fallback.
    authLogger.warn({ err }, 'logout_session_already_expired')
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.getAll().find((c) => c.name.includes('session_token'))
    if (sessionCookie) cookieStore.delete(sessionCookie.name)
  }

  redirect('/admin/login')
}
