## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

### Roles (Mana Chain)

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

Source: `src/constants/ManaRoles.sol`.

---

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
