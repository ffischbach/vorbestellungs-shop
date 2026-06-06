import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { twoFactor } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@repo/database'

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    // Sign-up in production deaktiviert — nur via pnpm admin:create (programmatisch) oder
    // ADMIN_SIGNUP_ENABLED=true temporär setzen, um den ersten Account anzulegen.
    disableSignUp: process.env.NODE_ENV === 'production' && process.env.ADMIN_SIGNUP_ENABLED !== 'true',
  },
  // nextCookies muss als letztes Plugin stehen — es liest die Set-Cookie-Header
  // aller vorherigen Plugins aus und schreibt sie via next/headers cookies() in den Browser.
  plugins: [twoFactor(), nextCookies()],
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
