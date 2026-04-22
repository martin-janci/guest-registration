# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ---- builder ----
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma      ./prisma
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma client needs a DATABASE_URL at generate time if the schema is read there;
# our client generation does not require an actual connection.
RUN npx prisma generate
# Dummy env vars satisfy the Zod env schema during Next.js static analysis / page-data collection.
RUN DATABASE_URL="postgres://build:build@localhost:5432/build" \
    SESSION_COOKIE_SECURE="false" \
    MINIO_ENDPOINT="http://localhost:9000" \
    MINIO_ACCESS_KEY="build" \
    MINIO_SECRET_KEY="build-secret" \
    MINIO_BUCKET="build" \
    SMTP_HOST="localhost" \
    SMTP_PORT="25" \
    SMTP_FROM="noreply@example.com" \
    CRON_SECRET="build-secret-12345" \
    npm run build

# ---- runner ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates tini && rm -rf /var/lib/apt/lists/*
RUN useradd --system --uid 1001 --create-home --home-dir /app nextjs
USER nextjs

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone output carries its own node_modules subset.
COPY --from=builder --chown=nextjs:nextjs /app/public                 ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone       ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static           ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/prisma                 ./prisma
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/.prisma   ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nextjs /app/node_modules/@prisma   ./node_modules/@prisma

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
