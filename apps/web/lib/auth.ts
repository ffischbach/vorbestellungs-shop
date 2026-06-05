import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { twoFactor } from 'better-auth/plugins'
import { db } from '@repo/database'

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    // Sign-up in production deaktiviert — nur via pnpm admin:create (programmatisch) oder
    // ADMIN_SIGNUP_ENABLED=true temporär setzen, um den ersten Account anzulegen.
    disableSignUp: process.env.NODE_ENV === 'production' && process.env.ADMIN_SIGNUP_ENABLED !== 'true',
  },
  plugins: [
    ...(process.env.NODE_ENV === 'production' ? [twoFactor()] : []),
  ],
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'],
})

export type Session = typeof auth.$Infer.Session
