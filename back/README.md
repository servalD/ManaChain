# Back ManaChain — API NestJS

API de la plateforme ManaChain : NestJS 11, architecture hexagonale par module
(auth, users, brands, likes, tokens), TypeORM + PostgreSQL 16, JWT, Google
OAuth, Swagger exposé sur `/api/docs`.

> Le détail par module (endpoints, flux auth, applications de marque…) vit dans
> [`back/docs/`](docs/) — en cours de remise à jour après la migration NestJS,
> se fier au code en cas de doute.

## Prérequis

- Node.js 22+ et pnpm (`corepack enable` suffit, la version est figée par le
  champ `packageManager`)
- Docker (pour la base Postgres et les e2e et le test de l'image en dev)

## 1. Configuration des variables d'environnement

```bash
cd back
cp .env.example .env
```

La config est validée au démarrage (`src/infrastructure/config/env.validation.ts`,
fail-fast) : une variable manquante ou malformée fait planter l'app immédiatement
avec la liste des problèmes.

| Variable                                        | Comment la remplir                                                                                                                                                                                                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_*`                                  | connexion Postgres. Les défauts collent au service`db` du compose dev lancé en local (voir .2). `DATABASE_SSL=true` uniquement pour une base managée (Azure)                                                                                                                                  |
| `APP_JWT_SECRET`                              | à générer soi-même :`openssl rand -base64 48` (min. 16 caractères). En changer invalide toutes les sessions en cours                                                                                                                                                                          |
| `APP_JWT_EXPIRES_IN`                          | durée de vie des jetons (`7d` par défaut)                                                                                                                                                                                                                                                        |
| `RESEND_API_KEY`                              | clé API [Resend](https://resend.com/api-keys) (domaine `EMAIL_FROM` à vérifier dans leur dashboard avant prod). **Laisser vide = mode simulation** : les emails (vérification, reset) sont seulement loggés en console                                                                       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Credentials → OAuth 2.0 Client ID (type « Web application »). Redirect URI en dev : `http://localhost:3001/api/auth/google/callback`. Optionnel : vide → l'endpoint `/api/auth/google` renvoie une erreur claire |
| `CORS_ORIGIN`, `FRONTEND_URL`, `API_URL`  | URLs du front et de l'API (défauts corrects pour le dev local)                                                                                                                                                                                                                                      |
| `PINATA_JWT`                                  | clé API [Pinata](https://app.pinata.cloud/developers/api-keys) (upload/delete IPFS, `POST/DELETE /api/media`). Optionnel : vide → l'upload renvoie une erreur claire, l'app démarre quand même                                                                                                |

## 2. Lancer le back en dev (`pnpm start:dev`)

Il faut un Postgres qui tourne. Le plus simple : démarrer uniquement le service
`db` du compose dev, puis lancer le back sur la machine :

```bash
pnpm install
docker compose -f docker/docker-compose.dev.yml up -d db   # Postgres 16 sur :5432
pnpm migration:run                                         # schéma à jour
pnpm start:dev                                             # watch mode
```

- API → http://localhost:3001/api
- Swagger → http://localhost:3001/api/docs
- Santé → http://localhost:3001/health

## 3. Tests unitaires

```bash
pnpm test        # 17 suites, fakes in-memory : aucune DB ni .env requis
pnpm test:cov    # avec couverture
```

> 📖 Les trois fichiers compose (dev / test / build) utilisés dans les sections
> suivantes sont documentés en détail dans [`docker/README.md`](docker/README.md) —
> ici, seulement les commandes et les différences de setup d'env.

## 4. Tests e2e (avec Docker Compose)

Les e2e démarrent l'app complète et frappent une vraie base : un Postgres
**éphémère** (tmpfs, rien n'est persisté) exposé sur le port **5433** pour ne
pas entrer en collision avec la base de dev du .2.

```bash
docker compose -f docker/docker-compose.test.yml up -d --wait
pnpm test:e2e
docker compose -f docker/docker-compose.test.yml down -v
```

**Setup d'env : rien à faire.** Contrairement au dev, aucun `.env` n'est
nécessaire : `test/setup-e2e.ts` embarque des défauts qui ciblent exactement ce
service (`manachain_test@localhost:5433`). Un `back/.env.test` (cf.
`.env.test.example`) reste possible pour surcharger, et la CI fournit ses
propres variables d'environnement.

## 5. Tout lancer avec Docker (compose dev)

Alternative au §2 : back **et** Postgres en conteneurs, avec live-reload (le
code est monté, `start:dev` tourne dans le conteneur).

```bash
cp .env.dev.example .env.dev
docker compose -f docker/docker-compose.dev.yml up
```

**Différence de setup d'env avec le §2** : le fichier est `.env.dev` (pas
`.env`) et `DATABASE_HOST=db`. Le back joint Postgres par le nom du service
compose, pas par `localhost`. Le fichier est partagé entre le service `db`
(variables `POSTGRES_*`) et le back (`DATABASE_*`) : les deux doivent rester
cohérents.

## 6. Builder les images avec le compose

```bash
export BACK_IMAGE=<registre>/manachain-back:<tag>     # défaut : ghcr.io placeholder
docker compose -f docker/docker-compose.build.yml build

# équivalent direct :
docker build -t manachain-back .
```

Caractéristiques de l'image (multi-stage, non-root, healthcheck, convention
`*_FILE` pour les secrets Swarm) : voir [`docker/README.md`](docker/README.md).

Pour le déploiement complet (Terraform, Ansible, Swarm, backups), voir
[`infra/README.md`](../infra/README.md).
