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

**Secrets** : l'entrypoint (`docker-entrypoint.sh`) résout la convention
`*_FILE` — toute variable `XXX_FILE` pointant vers un fichier lisible
(typiquement un secret Swarm sous `/run/secrets/`) est exportée en `XXX` avec
le contenu du fichier, ex. `DATABASE_PASSWORD_FILE=/run/secrets/database_password`.
Même pattern que l'image officielle postgres ; les variables d'env classiques
restent utilisables telles quelles (dev, CI).

## Fichiers Compose

| Fichier | Usage |
| --- | --- |
| `docker-compose.dev.yml` | Dev live-reload : back (watch) + Postgres. Lit `../.env.dev`. Joue `migration:run` au démarrage. Monitoring en profil opt-in (`--profile monitoring`). |
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

Monitoring opt-in (Prometheus + Grafana, inchangé sans le flag) :

```bash
docker compose -f back/docker/docker-compose.dev.yml --profile monitoring up
# prometheus → http://localhost:9090   grafana → http://localhost:3002 (accès anonyme Admin)
```

Détails : [back/docs/MONITORING.md](../docs/MONITORING.md).

## Tests e2e

```bash
docker compose -f back/docker/docker-compose.test.yml up -d
pnpm --dir back test:e2e
docker compose -f back/docker/docker-compose.test.yml down
```

`test/setup-e2e.ts` fournit déjà les défauts ciblant ce service (base
`manachain_test` sur `:5433`) ; un `back/.env.test` reste optionnel pour
surcharger. Les specs (`test/*.e2e-spec.ts`) démarrent l'app complète, jouent les
migrations sur un schéma vierge (drop + run), et exercent la vraie DB via HTTP.

## Build de l'image de prod

```bash
export BACK_IMAGE=ghcr.io/<owner>/manachain-back:<tag>
docker compose -f back/docker/docker-compose.build.yml build
# ou directement :
docker build -t manachain-back ./back
```

En production, jouer les migrations avec `pnpm migration:run:prod` (utilise `dist/`)
avant/à côté du démarrage de l'app.

## Tester les images buildées

`deploy/docker-compose.images.yml` (racine du repo) lance les images de prod
back + client avec un Postgres jetable et joue les migrations — la répétition
générale avant le déploiement Swarm. Mode d'emploi dans l'en-tête du fichier.
