# ==============================================================================
# Multi-Stage Dockerfile untuk Kasirin POS (Production Standalone Runner)
# Ringan, Cepat, dan Aman (Berjalan di bawah user non-root)
# ==============================================================================

# ------------------------------------------------------------------------------
# Tahap 1: Base Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ------------------------------------------------------------------------------
# Tahap 2: Dependencies Installer
# ------------------------------------------------------------------------------
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm ci --legacy-peer-deps

# ------------------------------------------------------------------------------
# Tahap 3: Next.js Standalone Builder
# ------------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Nonaktifkan telemetri Next.js saat build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Jalankan kompilasi standalone
RUN npm run build

# ------------------------------------------------------------------------------
# Tahap 4: Minimalist Production Runner (< 150 MB)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Pasang curl / wget untuk SRE Docker Healthcheck
RUN apk add --no-cache curl

# Jalankan kontainer dengan user non-root demi keamanan
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin aset statis publik
COPY --from=builder /app/public ./public

# Salin hasil kompilasi standalone Next.js dengan permission user nextjs
RUN mkdir .next && chown nextjs:nodejs .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Docker Healthcheck menggunakan endpoint SRE Liveness Probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
