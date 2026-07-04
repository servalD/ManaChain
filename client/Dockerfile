# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# Build multi-stage durci pour le client Next.js (ManaChain).
#   - builder : installe les deps, compile en sortie `standalone`
#   - runner  : image Alpine minimale tournant en utilisateur non-root `node`
#
# Les variables NEXT_PUBLIC_* sont inlinées dans le bundle AU BUILD : elles
# doivent être passées en build-args (voir .github/workflows/client.yml).
# PINATA_JWT reste une variable de runtime (côté serveur uniquement).
# ---------------------------------------------------------------------------

FROM node:22-alpine AS builder

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
ARG NEXT_PUBLIC_PINATA_GATEWAY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=$NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID \
    NEXT_PUBLIC_PINATA_GATEWAY=$NEXT_PUBLIC_PINATA_GATEWAY \
    NEXT_TELEMETRY_DISABLED=1

# pnpm via corepack (version figée par "packageManager" du package.json).
RUN corepack enable
WORKDIR /app

# Installer les dépendances d'abord pour maximiser le cache de couches.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build


FROM node:22-alpine AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Appliquer les correctifs OpenSSL pendant qu'on est root, puis lâcher les privilèges.
RUN apk update && apk upgrade --no-cache libcrypto3 libssl3

USER node

# La sortie standalone embarque server.js + le strict nécessaire de node_modules ;
# les assets statiques et public/ ne sont pas inclus et doivent être copiés à côté.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Entrypoint qui résout les secrets Docker (variables *_FILE → variable nue),
# ex. PINATA_JWT_FILE=/run/secrets/pinata_jwt.
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["node", "server.js"]
