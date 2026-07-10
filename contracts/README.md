# ManaChain — Smart Contracts

Contrats Solidity de la plateforme ManaChain (support de marques via tokens
fractionnés + billetterie d'événements), déployés sur **Avalanche Fuji (testnet)**.
Build/test/déploiement via [Foundry](https://book.getfoundry.sh/).

Vue d'ensemble fonctionnelle (fractionalisation, escrow, admin, événements) :
[`doc.txt`](./doc.txt). Procédure de démarrage/redéploiement multi-app (contracts +
back + client) : [`../deploy/RUNBOOK.md`](../deploy/RUNBOOK.md). Commandes `cast` pour
interagir avec les contrats déployés : [`cast-interactions.md`](./cast-interactions.md).
Dernier audit : [`manachain_audit_report.md`](./manachain_audit_report.md).

## Contrats (`src/`)

| Contrat | Module | Rôle |
|---------|--------|------|
| `ManaAdmin` | `access/` | Contrôle d'accès plateforme (whitelist/blacklist marques, fees, cancel), UUPS |
| `BrandFactory` | `factory/` | Déploie les modules par-marque (Genesis NFT, Vault, Support Token) pour une marque whitelistée |
| `EventFactory` | `factory/` | Déploie les modules d'événement (tickets, sale) pour une marque whitelistée |
| `SaleFactory` | `factory/` | Registre on-chain des ventes reconnues par la plateforme (découverte pour l'indexer) |
| `BrandGenesisNFT` | `brand/` | ERC-721 « Genesis » identitaire de la marque, UUPS |
| `FractionalVault` | `brand/` | Verrouille le Genesis NFT, contrôle mint/burn du Support Token |
| `BrandSupportToken` | `brand/` | ERC-20 de fractionnalisation, mint/burn exclusif du Vault |
| `TokenSaleEscrow` | `brand/` | Vente primaire en USDC, séquestre les fonds, remboursement on-chain si vente annulée |
| `EventTickets` | `events/` | ERC-1155 billets (1 event = 1 `tokenId`), UUPS |
| `TicketSale` | `events/` | Vente primaire des billets (payante ou gratuite) |
| `MockUSDC` | `mocks/` | Stablecoin de test (6 décimales, faucet plafonné) — **jamais en mainnet** |

### Rôles (Mana Chain)

| Contract | Role | Constant / Mechanism | Capabilities |
|----------|------|----------------------|--------------|
| **ManaAdmin** | Admin | `DEFAULT_ADMIN_ROLE` | Upgrade UUPS, grant/revoke |
| **ManaAdmin** | Operator | `OPERATOR_ROLE` | Whitelist/blacklist, fees, cancelTokenSale |
| **BrandGenesisNFT** | Admin | `DEFAULT_ADMIN_ROLE` | Upgrade UUPS |
| **BrandGenesisNFT** | Minter | `MINTER_ROLE` | mint, safeMint, setTokenImageURI |
| **EventTickets** | Admin | `DEFAULT_ADMIN_ROLE` | Upgrade UUPS, setImageURI |
| **EventTickets** | Minter | `MINTER_ROLE` | mint, mintBatch |
| **FractionalVault** | Owner | `owner()` | setSupportToken, setEscrow, depositGenesis, mintSupport, burnSupport, burnVaultBalance, upgrade |
| **FractionalVault** | Escrow | `_escrow` | burnVaultBalance |
| **BrandSupportToken** | Vault | `_vault` | mint, burn, setImageURI |
| **TokenSaleEscrow** | Brand | `brand` | endSale, claimByBrand, cancelByBrand |
| **TokenSaleEscrow** | ManaAdmin | `manaAdmin` | cancelSaleByAdmin |
| **TicketSale** | Brand | `brand` | setPrice |
| **BrandFactory** | Brand | `msg.sender == brand` + whitelist | deployBrandModule |
| **EventFactory** | Brand | `msg.sender == brand` + whitelist | deployEventModule |

Source : `src/constants/ManaRoles.sol`.

## Déploiement actuel

Réseau **Avalanche Fuji** (chainId `43113`). Adresses à jour dans
[`config/deploy.json`](./config/deploy.json) → `deployed.*` (mis à jour automatiquement
par `DeployAll.s.sol` à chaque redéploiement). Ne jamais coder une adresse en dur
ailleurs — le back (`chain-sync`) et le front (`NEXT_PUBLIC_*`) lisent leurs adresses
depuis leur propre `.env`, copiées depuis ce fichier (voir `../deploy/RUNBOOK.md` §4).

## Usage

### Build

```shell
forge build
```

### Test

```shell
forge test
```

157 tests (unit + integration), voir `test/unit/` et `test/integration/`.

### Format

```shell
forge fmt
```

### Anvil (nœud local)

```shell
anvil
```

### Déploiement

Configuration métier (admin, marque de démo, event, ventes) dans
[`config/deploy.json`](./config/deploy.json), secrets dans `.env` (voir
`.env.example` — `PRIVATE_KEY`, `ETHERSCAN_API_KEY`, jamais commités).

```shell
# Déploiement complet (MockUSDC + ManaAdmin + factories) — écrit config/deploy.json
forge script script/DeployAll.s.sol --rpc-url fuji --broadcast

# Redéploiement partiel : un seul module
forge script script/DeployBrandModule.s.sol --rpc-url fuji --broadcast
forge script script/DeployEventModule.s.sol --rpc-url fuji --broadcast
forge script script/DeployTokenSaleEscrow.s.sol --rpc-url fuji --broadcast
forge script script/DeployTicketSale.s.sol --rpc-url fuji --broadcast

# Upgrade UUPS de ManaAdmin
forge script script/UpgradeManaAdmin.s.sol --rpc-url fuji --broadcast
```

Après tout redéploiement, suivre la procédure de resynchronisation de l'indexeur
(`chain-sync`) et de mise à jour des `.env` back/front : `../deploy/RUNBOOK.md` §4.

### Cast

Voir [`cast-interactions.md`](./cast-interactions.md) pour l'ensemble des commandes
`cast` d'interaction avec les contrats déployés (admin, marque, achat, événements).

```shell
cast <subcommand>
```

### Help

```shell
forge --help
anvil --help
cast --help
```

## Documentation

https://book.getfoundry.sh/
