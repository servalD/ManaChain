# Client ManaChain — Front Next.js

Front de la plateforme ManaChain : Next.js 16 (App Router, Turbopack),
React 19, Tailwind CSS 4, connexion wallet via Dynamic SDK + Wagmi/Viem,
médias sur IPFS via Pinata.

## Prérequis

- Node.js 22+ et pnpm (`corepack enable` suffit, la version est figée par le
  champ `packageManager`)
- Le back qui tourne pour toutes les pages qui parlent à l'API — voir le
  [README du back](../back/README.md)

## 1. Configuration des variables d'environnement

```bash
cd client
cp .env.example .env
```

⚠️ Deux familles de variables, au comportement très différent :

- **`NEXT_PUBLIC_*`** : inlinées dans le bundle **au build** (`pnpm build` /
  build de l'image Docker). Elles sont publiques (visibles dans le JS servi au
  navigateur) et **figées** : les changer impose de rebuilder.
- **`PINATA_JWT`** : lue **au runtime**, côté serveur Next uniquement — c'est
  un secret, jamais dans le bundle.

| Variable                               | Comment la remplir                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                | URL de l'API back. Dev :`http://localhost:3001/api`. Prod : `https://<domaine>/api`                          |
| `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` | [dashboard Dynamic](https://app.dynamic.xyz/) → ton projet → Developers → Environment ID (sandbox pour le dev) |
| `PINATA_JWT`                         | [dashboard Pinata](https://app.pinata.cloud/developers/api-keys) → API Keys → New Key                           |
| `NEXT_PUBLIC_PINATA_GATEWAY`         | dashboard Pinata → Gateways (ex.`xxx.mypinata.cloud`, sans `https://`)                                      |

## 2. Lancer en dev

```bash
pnpm install
pnpm dev        # http://localhost:3000, hot-reload
```

Alternative en conteneur (hot-reload aussi, le code est monté) :

```bash
docker compose -f docker/docker-compose.dev.yml up
```

Le `.env` local suffit dans les deux cas : en dev les `NEXT_PUBLIC_*` sont lues
au démarrage (pas d'inlining figé comme en prod), et leurs URLs `localhost`
restent correctes car c'est le **navigateur** qui les consomme, pas le conteneur.

## 3. Lint et build de prod local

```bash
pnpm lint
pnpm build      # sortie standalone (.next/standalone), cf. next.config.ts
pnpm start      # sert le build
```

Le build **prérend les pages** : il exécute le code côté serveur, donc
`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` doit être définie (le provider Dynamic du
layout racine plante sinon) — via ton `.env` en local.

## 4. Builder l'image Docker

Le `.dockerignore` exclut les `.env*` du contexte (aucun secret figé dans une
image) : les `NEXT_PUBLIC_*` doivent donc être passées en **build-args**,
obligatoirement :

```bash
docker compose --env-file .env -f docker/docker-compose.build.yml build
```

Les build-args sont interpolés depuis le `.env` (ou l'environnement) ; l'image
produite est `manachain-client:local` par défaut, surchargeable via `CLIENT_IMAGE`.

Pour **tester les images buildées** (back + client + Postgres jetable, comme en
prod) : `deploy/docker-compose.images.yml` à la racine du repo — voir son
en-tête pour le mode d'emploi.

Conséquence de l'inlining : **une image = un environnement**. L'image de prod
est buildée par la CI (`.github/workflows/client.yml`) avec les variables
GitHub ; des valeurs factices suffisent pour tester que le build passe.

`PINATA_JWT`, elle, se fournit au **run** (`docker run -e PINATA_JWT=…`, ou le
secret Swarm `pinata_jwt` en prod).

L'image (multi-stage, non-root, healthcheck) suit le même modèle que celle du
back. Pour le déploiement complet (Swarm, traefik, CI/CD), voir
[`infra/README.md`](../infra/README.md).

## Tests

Pas encore de tests d'interface — Playwright est prévu (parcours register,
login, découverte…) et sera branché sur la CI.
