#!/bin/sh
set -e
prisma migrate deploy --schema /app/packages/database/prisma/schema.prisma
exec node apps/web/server.js
