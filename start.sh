#!/bin/sh
set -e
# 1) Align SQLite schema with prisma/schema.prisma (idempotent).
# 2) Seed reference content only when tables are empty (also idempotent) and
#    create the admin user from ADMIN_PASSWORD on first boot.
# 3) Start the app.
npx prisma db push --accept-data-loss
npx tsx prisma/seed.ts
exec node server.js