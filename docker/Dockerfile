# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS deps
WORKDIR /app
# Install openssl so Prisma can detect the correct OpenSSL version (alpine ships libssl.so.3).
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Stub env vars so next build's page-data collection can load env.ts without a real .env.
# These are build-time only; runtime containers get real values via compose/k8s env.
ENV DATABASE_URL=postgresql://placeholder:placeholder@placeholder:5432/placeholder
ENV SESSION_COOKIE_SECURE=false
ENV MINIO_ENDPOINT=http://placeholder:9000
ENV MINIO_ACCESS_KEY=placeholder
ENV MINIO_SECRET_KEY=placeholder
ENV MINIO_BUCKET=placeholder
ENV SMTP_HOST=placeholder
ENV SMTP_PORT=25
ENV SMTP_FROM=placeholder@placeholder.invalid
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Install openssl so Prisma's query engine (linux-musl-arm64-openssl-3.0.x) can load libssl.so.3.
RUN apk add --no-cache openssl && addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
