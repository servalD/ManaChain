# Seed de démo

Peuple un environnement (dev local ou Fuji) avec des admins, brands, clients, produits/events
et achats, sans passer par l'UI. Source de vérité unique : `contracts/config/demo-seed.json`.

## Répartition par type d'action

- **REST pur** (`demo/seed-api.ts`) : inscription, candidature de marque, approbation, upload
  IPFS + confirmation média, brouillon + publication d'événement. Aucune clé privée requise.
- **Signature wallet** (`contracts/script/SeedDemo.s.sol`) : whitelist, déploiement du module de
  marque, mint/lock du Genesis NFT, ouverture de vente, déploiement du module événement +
  vente de tickets, achats clients. Nécessite une clé privée par acteur (`demo/.env`).
- **Aucune saisie manuelle en base ni via l'UI** — un seul geste manuel reste hors script :
  financer les wallets de démo en AVAX sur Fuji (faucet testnet). Le financement en USDC de
  test est scriptable (`MockUSDC.mint`, permissionless).

## Prérequis backend

```
SKIP_EMAIL_VERIFICATION=true   # sinon login/approve bloqués sans lien email cliquable
BOOTSTRAP_ADMIN_EMAIL=<= admin.bootstrapEmail de demo-seed.json>
CHAIN_SYNC_ENABLED=true
CHAIN_RPC_URL=<même chaîne que --rpc-url utilisé ci-dessous>
```
Ne jamais activer `SKIP_EMAIL_VERIFICATION` en prod.

## Lancer

```bash
cp demo/.env.example demo/.env   # renseigner PK_ADMIN_OPERATOR, PK_BRAND_*, PK_CLIENT_*
cd demo && npm install && cd ..
# déployer l'infra plateforme si ce n'est pas déjà fait sur cette chaîne :
#   (cd contracts && forge script script/DeployAll.s.sol --rpc-url <local|fuji> --broadcast)
demo/run-demo-seed.sh local   # ou: demo/run-demo-seed.sh fuji
```

Le script tourne en 3 phases séquentielles (voir `demo/seed-api.ts` et `SeedDemo.s.sol` pour le
détail) : REST (users/candidatures/images/brouillons) → on-chain (whitelist/déploiement/achats)
→ REST (liaison des adresses on-chain aux événements + publication).

État inter-phases dans `contracts/config/demo-seed.output.json` (généré, gitignored).

## Images

Voir `demo/assets/README.md` — un fichier absent est juste sauté (log `[skip]`), la démo ne
bloque pas dessus.
