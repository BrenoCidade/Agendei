# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN corepack enable

WORKDIR /app

# Copiar manifests — esta layer só reexecuta quando dependências mudam
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc* ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# Instalar todas as deps (devDeps necessárias para compilar TypeScript)
RUN pnpm install --frozen-lockfile

# Copiar código-fonte
COPY packages/shared/ ./packages/shared/
COPY packages/server/ ./packages/server/

# Build em ordem: shared → prisma generate → server
RUN pnpm --filter @saas/shared build
RUN pnpm --filter server exec prisma generate
RUN pnpm --filter server build

# Criar deployment isolado: resolve workspace: deps e filtra só prod
RUN pnpm --filter server deploy --prod /deploy

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# node_modules de produção (inclui @saas/shared resolvido via workspace:)
COPY --from=builder /deploy/node_modules ./node_modules

# Dist compilado (pnpm deploy não copia dist automaticamente)
COPY --from=builder /app/packages/server/dist ./dist

# Schema Prisma + cliente gerado (binário linux-musl compatible com alpine)
COPY --from=builder /app/packages/server/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3333

CMD ["node", "dist/server/src/main.js"]
