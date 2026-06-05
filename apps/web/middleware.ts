import { NextRequest, NextResponse } from 'next/server'

// Cookie-Name, den Better Auth standardmäßig setzt
const SESSION_COOKIE = 'better-auth.session_token'

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/setup', '/admin/login/totp']

export function middleware(request: NextRequest) {
  if (PUBLIC_ADMIN_PATHS.some((p) => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Nur Vorhandensein des Cookies prüfen — echte Validierung passiert in den Server Actions
  const sessionToken = request.cookies.get(SESSION_COOKIE)
  if (!sessionToken) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
