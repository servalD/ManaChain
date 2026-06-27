# Docker — back ManaChain

Le `Dockerfile` est à la racine du back (`back/Dockerfile`). Ce dossier contient les
fichiers Compose. **Pas de Supabase** : une instance PostgreSQL locale est utilisée.

## Image

Multi-stage, durcie, tournant **non-root** :

| Image | Base | User | Port | Healthcheck |
| --- | --- | --- | --- | --- |
| `manachain-back` | `node:22-alpine` | `node` | 3001 | `GET /health` |

Le build élague aux dépendances de production (`pnpm prune --prod`) et patche
OpenSSL (`libssl3`/`libcrypto3`).

## Fichiers Compose

| Fichier | Usage |
| --- | --- |
| `docker-compose.dev.yml` | Dev live-reload : back (watch) + Postgres. Lit `../.env.dev`. Joue `migration:run` au démarrage. |
| `docker-compose.test.yml` | Postgres éphémère (tmpfs) sur `:5433` pour les tests e2e. |
| `docker-compose.build.yml` | Build de l'image de prod en local / CI. |

## Dev

```bash
cp back/.env.dev.example back/.env.dev   # ajuster si besoin
docker compose -f back/docker/docker-compose.dev.yml up
# back → http://localhost:3001  (GET /health, Swagger sur /api/docs)
# db   → localhost:5432 (postgres 16)
```

Le service `back` lance la migration baseline puis `start:dev` (watch). La base est
persistée dans le volume `postgres_dev_data`.

## Tests e2e

```bash
docker compose -f back/docker/docker-compose.test.yml up -d
cp back/.env.test.example back/.env.test
pnpm --dir back test:e2e
docker compose -f back/docker/docker-compose.test.yml down
```

## Build de l'image de prod

```bash
export BACK_IMAGE=ghcr.io/<owner>/manachain-back:<tag>
docker compose -f back/docker/docker-compose.build.yml build
# ou directement :
docker build -t manachain-back ./back
```

En production, jouer les migrations avec `pnpm migration:run:prod` (utilise `dist/`)
avant/à côté du démarrage de l'app.
