import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').startsWith('https://')
  ? '__Secure-better-auth.session_token'
  : 'better-auth.session_token'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/setup', '/admin/login/totp']

export function middleware(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', requestId)

  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  if (PUBLIC_ADMIN_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Nur Vorhandensein des Cookies prüfen — echte Validierung passiert in den Server Actions
  const sessionToken = request.cookies.get(SESSION_COOKIE)
  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
