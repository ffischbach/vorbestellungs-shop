import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@repo/config', '@repo/database', '@repo/email'],
  serverExternalPackages: ['better-auth', '@better-auth/kysely-adapter', 'kysely'],
}

export default nextConfig
