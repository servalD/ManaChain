#!/usr/bin/env bash
# Peuple un environnement de démo de bout en bout : REST (users/brands/events) puis
# on-chain (whitelist/déploiement/achats), dans l'ordre requis par les dépendances.
#
# Usage: demo/run-demo-seed.sh local|fuji
#
# Prérequis :
#   - demo/.env rempli (copier depuis demo/.env.example)
#   - backend démarré avec SKIP_EMAIL_VERIFICATION=true, BOOTSTRAP_ADMIN_EMAIL aligné sur
#     admin.bootstrapEmail (contracts/config/demo-seed.json), CHAIN_SYNC_ENABLED=true et
#     CHAIN_RPC_URL sur la même chaîne que la cible choisie ici
#   - contracts/config/deploy.json déjà rempli par un DeployAll.s.sol réussi sur cette chaîne
#   - target=fuji : wallets PK_* déjà financés en AVAX (faucet testnet, manuel) — l'USDC de
#     test est financée automatiquement par SeedDemo.s.sol (MockUSDC.mint, permissionless)
set -euo pipefail

TARGET="${1:-}"
if [[ "$TARGET" != "local" && "$TARGET" != "fuji" ]]; then
  echo "Usage: $0 local|fuji" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="http://localhost:8545"
[[ "$TARGET" == "fuji" ]] && RPC_URL="fuji"

if [[ ! -f "$ROOT_DIR/demo/.env" ]]; then
  echo "Missing demo/.env — copy demo/.env.example and fill it in first." >&2
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "$ROOT_DIR/demo/.env"
set +a

echo "=== Phase A (REST): users, brand applications, images, event drafts ==="
(cd "$ROOT_DIR/demo" && npx tsx seed-api.ts pre)

echo "=== Phase B (on-chain): whitelist, brand modules, events, client purchases ==="
(cd "$ROOT_DIR/contracts" && forge script script/SeedDemo.s.sol --rpc-url "$RPC_URL" --broadcast -vvv)

echo "=== Phase C (REST): link deployed contracts to events, publish ==="
(cd "$ROOT_DIR/demo" && npx tsx seed-api.ts post)

echo "=== Demo seed done ==="
