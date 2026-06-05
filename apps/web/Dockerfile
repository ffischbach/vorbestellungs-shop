FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.5.2 --activate

# Prisma CLI global in Alpine installieren — alle deps (inkl. effect, @prisma/*) landen
# unter /usr/local/lib/node_modules/ und musl-Binaries werden korrekt geladen
FROM node:22-alpine AS prisma-installer
COPY packages/database/package.json /tmp/db-pkg.json
RUN PRISMA_VERSION=$(node -p "require('/tmp/db-pkg.json').devDependencies.prisma.replace(/[\\^~]/,'')") && \
    npm install -g prisma@${PRISMA_VERSION}

# Prune monorepo — nur was @repo/web braucht
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo@^2
COPY . .
RUN turbo prune @repo/web --docker

# Dependencies installieren
FROM base AS deps
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @repo/database generate
RUN pnpm turbo run build --filter=@repo/web

# Produktions-Image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=prisma-installer /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY apps/web/entrypoint.sh ./entrypoint.sh
RUN ln -sf /usr/local/lib/node_modules/prisma/build/index.js /usr/local/bin/prisma && \
    chmod +x entrypoint.sh

USER nextjs
EXPOSE 3000
CMD ["./entrypoint.sh"]
