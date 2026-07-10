# Runbook — exploitation ManaChain (back, front, chain-sync, contrats)

Ce document couvre le démarrage/redémarrage des 3 apps (`contracts/`, `back/`,
`client/`), les variables d'environnement nécessaires à chacune, et la procédure à
suivre après un redéploiement des smart contracts (nouvelles adresses → l'indexeur
`chain-sync` doit repartir du bon bloc).

Infra Azure/Swarm (Traefik, Grafana/Prometheus, backups) : voir `infra/README.md` et
`infra/MONITORING.md`. Ce runbook se concentre sur l'ordre applicatif, pas sur le
provisioning des VM.

## 1. Ordre de démarrage

L'ordre est important : les migrations doivent tourner avant que le back accepte du
trafic, et `chain-sync` doit être activé après les migrations chain-sync (baseline
inclut déjà `chain_sync_cursor`/`brand_contracts`/`token_sale`/etc., donc c'est en
pratique la même étape que "migrations" ci-dessous).

1. **Base de données** — s'assurer que Postgres est up (managé, cf.
   `infra/terraform/`) et accessible avec les identifiants de `back/.env` (voir §2).
2. **Migrations** :
   ```bash
   cd back
   pnpm install
   pnpm migration:run
   ```
   Idempotent (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) — sûr à
   rejouer sur une base déjà à jour.
3. **Back** — démarrer avec `CHAIN_SYNC_ENABLED=true` (voir §2) une fois les
   adresses de contrats connues (post-déploiement, §4 si c'est un redéploiement) :
   ```bash
   pnpm build
   pnpm start:prod   # ou start:dev en local
   ```
   Au boot, vérifier dans les logs que tous les modules s'initialisent sans erreur
   de dépendance circulaire (`AppModule dependencies initialized`, chaque module
   listé) et que `ChainSyncService` n'affiche PAS `disabled` si
   `CHAIN_SYNC_ENABLED=true` a bien été pris en compte.
4. **Front** — démarrer une fois le back joignable (health check `GET /api/health`) :
   ```bash
   cd client
   pnpm install
   pnpm build
   pnpm start
   ```

Health checks : `GET /api/health` (back), `GET /api/chain-sync/status` (retard de
l'indexeur en blocs, utile après le redémarrage pour vérifier qu'il rattrape).

## 2. Variables d'environnement par app

Référence complète : `back/.env.example`, `client/.env.example`,
`contracts/.env.example`. Points d'attention en production :

### `back/.env`
- `DATABASE_*` : Postgres managé (jamais le conteneur `docker-compose.test.yml`, qui
  est éphémère et réservé aux tests e2e locaux).
- `APP_JWT_SECRET` : doit rester stable entre déploiements (invalide toutes les
  sessions sinon).
- `CHAIN_SYNC_ENABLED=true` en production dès que les adresses ci-dessous sont
  connues ; `false` acceptable pour un environnement de démo sans besoin de lire la
  chaîne (le reste de l'app fonctionne, juste sans synchronisation on-chain).
- `CHAIN_RPC_URL` : RPC Fuji (ou local `http://localhost:8545` contre anvil, jamais
  en prod).
- `MANA_ADMIN_ADDRESS`, `BRAND_FACTORY_ADDRESS`, `SALE_FACTORY_ADDRESS`,
  `EVENT_FACTORY_ADDRESS`, `USDC_ADDRESS` : copier depuis
  `contracts/config/deploy.json` → `deployed.*` après un déploiement (voir §4).
- `CHAIN_SYNC_START_BLOCK` : bloc de déploiement des contrats (voir §4) — n'a d'effet
  que si `chain_sync_cursor` est vide/à zéro pour l'id `main` (voir §4.2).

### `client/.env` (ou build-args de l'image Docker — ces variables sont inlinées au
build Next.js, pas lues au runtime)
- `NEXT_PUBLIC_API_URL` : URL publique du back (`/api`).
- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` : environnement Dynamic Labs (connexion
  wallet) — voir `COMPLIANCE.md` pour le statut sous-traitant.
- `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_CHAIN_ID=43113` (Fuji) : mêmes valeurs que côté
  back, adaptées au préfixe `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_MANA_ADMIN_ADDRESS`, `NEXT_PUBLIC_BRAND_FACTORY_ADDRESS`,
  `NEXT_PUBLIC_SALE_FACTORY_ADDRESS`, `NEXT_PUBLIC_EVENT_FACTORY_ADDRESS`,
  `NEXT_PUBLIC_USDC_ADDRESS` : mêmes adresses que côté back (`deployed.*`). Les
  adresses par-marque (vault, escrow, supportToken, ticketSale) ne sont **jamais**
  ici : elles viennent de l'API (`chain_sync` les résout depuis les events des
  factories), jamais d'une variable d'env.
- `PINATA_JWT` : côté serveur uniquement (route API Next `/api/pinata/*`), jamais
  inlinée dans le bundle client.

### `contracts/.env` (déploiement uniquement, jamais commité)
- `PRIVATE_KEY` : clé du déployeur. Voir `temp-plan/phase-0-contracts.md` — le
  redéploiement Fuji nécessite la clé de l'utilisateur, jamais partagée dans ce repo.
- `ETHERSCAN_API_KEY` : vérification du bytecode (optionnel, `--verify`).

## 3. Démarrage local rapide (dev)

```bash
# Postgres de dev (docker-compose.test.yml pour un Postgres éphémère si besoin)
cd back && pnpm install && pnpm migration:run && pnpm start:dev
cd client && pnpm install && pnpm dev
```

`CHAIN_SYNC_ENABLED=false` par défaut en dev (pas besoin de RPC pour itérer sur le
reste de l'app). Pour tester le flux on-chain complet en local, voir
`temp-plan/phase-2-back-chain-sync.md` (anvil) — aucun réseau local persistant n'est
fourni par ce repo, à monter au besoin (`anvil` + `forge script ... --rpc-url
http://localhost:8545`).

## 4. Procédure de redéploiement des smart contracts

Un redéploiement (nouvelle version des contrats, ou nouvel environnement) invalide
toutes les adresses connues du back/front **et** l'historique de blocs déjà indexé
par `chain-sync` — repartir de zéro sur l'ancien curseur ferait relire des events
d'une version de contrat qui n'existe plus (ou pire, raterait les nouveaux events
émis avant que le curseur ne soit à jour).

### 4.1 Déployer

```bash
cd contracts
forge script script/DeployAll.s.sol --rpc-url fuji --broadcast --verify -vvvv
```

Ce script lit `config/deploy.json` (sections `admin`/`brand`/`event`/`tokenSale`/
`ticketSale`) et **écrit** les nouvelles adresses dans `config/deploy.json` →
`deployed.*`. Relever aussi le **numéro de bloc** de la transaction de déploiement de
`ManaAdmin` (premier contrat déployé) — c'est le `CHAIN_SYNC_START_BLOCK` à utiliser
(cf. `broadcast/DeployAll.s.sol/<chainId>/run-latest.json` généré par Foundry,
champ `receipts[].blockNumber` de la première transaction).

### 4.2 Repartir l'indexeur du bon bloc

`chain-sync` lit son point de départ ainsi (`chain-sync.service.ts`) : si la ligne
`chain_sync_cursor` (id `main`) a `last_processed_block > 0`, il reprend juste
après ; sinon il utilise `CHAIN_SYNC_START_BLOCK`. Donc pour un redéploiement :

1. Mettre à jour `CHAIN_SYNC_START_BLOCK` et les 5 adresses (`MANA_ADMIN_ADDRESS`,
   `BRAND_FACTORY_ADDRESS`, `SALE_FACTORY_ADDRESS`, `EVENT_FACTORY_ADDRESS`,
   `USDC_ADDRESS`) dans `back/.env` avec les nouvelles valeurs de
   `contracts/config/deploy.json`.
2. Réinitialiser le curseur en base (sinon `CHAIN_SYNC_START_BLOCK` est ignoré,
   cf. logique ci-dessus) :
   ```sql
   DELETE FROM chain_sync_cursor WHERE id = 'main';
   -- ou : UPDATE chain_sync_cursor SET last_processed_block = 0 WHERE id = 'main';
   ```
3. Redémarrer le back. Vérifier `GET /api/chain-sync/status` : le retard en blocs
   doit redescendre progressivement (l'indexeur rattrape par chunks, voir
   `CHAIN_SYNC_POLL_INTERVAL_MS`).
4. Mettre à jour les `NEXT_PUBLIC_*_ADDRESS` côté front avec les mêmes nouvelles
   adresses, puis rebuild/redéployer (variables inlinées au build, pas au runtime).

### 4.3 Redéploiement partiel (un seul module)

Si seul un module est redéployé (ex. `DeployBrandModule.s.sol` après un correctif
sur `BrandFactory` uniquement), seule l'adresse concernée change — mettre à jour la
variable d'env correspondante des deux côtés (back + front) et **quand même**
réinitialiser le curseur si le nouveau contrat a été déployé à un bloc antérieur au
curseur actuel (sinon ses events passés ne seront jamais lus). Si le nouveau contrat
est déployé après le curseur actuel, un simple redémarrage suffit — pas besoin de
reset.

## 5. Rollback

Pas de rollback automatisé pour les migrations en production (les migrations de ce
repo sont additives — `ADD COLUMN`, `CREATE TABLE IF NOT EXISTS` — donc un rollback
de code sans rollback de schéma reste compatible dans la quasi-totalité des cas).
Pour revenir en arrière sur une migration précise : `pnpm migration:revert` (back),
un cran à la fois, en vérifiant le `down()` de chaque migration avant de l'exécuter
en production.
