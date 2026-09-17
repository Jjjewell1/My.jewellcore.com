FROM node:20-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm rebuild better-sqlite3

# Prerender targets a seeded SQLite DB (same flow as local builds against dev.db).
ARG DATABASE_URL=file:./dev.db
ARG SESSION_SECRET
ARG ADMIN_PASSWORD
ARG FORCE_ADMIN_RESET=false
ARG NTFY_TOPIC_URL
ARG NTFY_ACCESS_TOKEN
ENV DATABASE_URL=$DATABASE_URL \
    SESSION_SECRET=$SESSION_SECRET \
    ADMIN_PASSWORD=$ADMIN_PASSWORD \
    FORCE_ADMIN_RESET=$FORCE_ADMIN_RESET \
    NTFY_TOPIC_URL=$NTFY_TOPIC_URL \
    NTFY_ACCESS_TOKEN=$NTFY_ACCESS_TOKEN
RUN mkdir -p /app/data && npx prisma db push --accept-data-loss && npx tsx prisma/seed.ts
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm install prisma@7 --omit=dev --ignore-scripts \
  && npm install tsx --omit=dev --ignore-scripts \
  && npm rebuild better-sqlite3
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# provider catalog is imported by prisma/seed.ts at container start
COPY --from=builder /app/lib/providers.ts ./lib/providers.ts
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
EXPOSE 3000
ENV PORT=3000
CMD ["./start.sh"]
