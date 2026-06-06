import { NextRequest, NextResponse } from 'next/server'

// Better Auth setzt den __Secure- Präfix wenn die baseURL mit https:// beginnt.
// Der Präfix ist Teil des Cookie-Namens und muss hier exakt übereinstimmen.
const SESSION_COOKIE = (process.env.BETTER_AUTH_URL ?? 'http://localhost:3000').startsWith('https://')
  ? '__Secure-better-auth.session_token'
  : 'better-auth.session_token'

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
