# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Build multi-stage durci pour le back NestJS (ManaChain).
#   - builder : installe toutes les deps, compile, puis élague aux deps de prod
#   - runner  : image Alpine minimale tournant en utilisateur non-root `node`
# ---------------------------------------------------------------------------

FROM node:22-alpine AS builder

# pnpm via corepack (version figée par "packageManager" du package.json).
RUN corepack enable
WORKDIR /app

# Installer les dépendances d'abord pour maximiser le cache de couches.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build && pnpm prune --prod


FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Appliquer les correctifs OpenSSL pendant qu'on est root, puis lâcher les privilèges.
RUN apk update && apk upgrade --no-cache libcrypto3 libssl3

# Lâcher les privilèges : l'image de base fournit un utilisateur non-root `node`.
USER node

# Artefacts strictement nécessaires au runtime (dist, deps de prod, manifeste,
# assets servis statiquement — logo des emails).
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/assets ./assets

# Entrypoint qui résout les secrets Docker (variables *_FILE → variable nue).
COPY --chown=node:node docker/docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3001

# Healthcheck sur la route publique /health (hors préfixe /api).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
