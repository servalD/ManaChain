// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ManaAdmin} from "../src/access/ManaAdmin.sol";
import {ManaRoles} from "../src/constants/ManaRoles.sol";
import {BrandGenesisNFT} from "../src/brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../src/brand/FractionalVault.sol";
import {BrandSupportToken} from "../src/brand/BrandSupportToken.sol";
import {EventTickets} from "../src/events/EventTickets.sol";
import {BrandFactory} from "../src/factory/BrandFactory.sol";
import {EventFactory} from "../src/factory/EventFactory.sol";
import {SaleFactory} from "../src/factory/SaleFactory.sol";
import {IManaAdmin} from "../src/interfaces/IManaAdmin.sol";
import {ISaleFactory} from "../src/interfaces/ISaleFactory.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice One-shot deployment: core infra + brand module + genesis lock + token sale
 *         (via vault.openSale) + event module + ticket sale (via SaleFactory).
 *         This is the platform's canonical flow — the indexer discovers the sales
 *         through the SaleFactory events.
 *
 * The broadcaster (private key used) acts as the deployer for everything.
 * The factories require msg.sender == brand, so the broadcaster is used as the
 * brand for those calls. If brand.address differs from the broadcaster, ownership
 * and roles are transferred to brand.address at the end — note that the sales
 * deployed here still pay proceeds to the broadcaster in that case; real brand
 * flows go through the app.
 *
 * Reads:  config/deploy.json → all sections
 * Writes: config/deploy.json → deployed.* (all addresses)
 *
 * Run (Fuji):
 *   forge script script/DeployAll.s.sol --rpc-url fuji --broadcast --verify -vvvv
 */
contract DeployAll is DeployConfig {
    function run() external {
        AdminCfg memory adminCfg       = readAdminCfg();
        BrandCfg memory brandCfg       = readBrandCfg();
        EventCfg memory eventCfg       = readEventCfg();
        TokenSaleCfg memory tokenSaleCfg = readTokenSaleCfg();
        TicketSaleCfg memory ticketSaleCfg = readTicketSaleCfg();

        vm.startBroadcast();

        // msg.sender in broadcast == the account signing transactions.
        // All factory calls must use broadcaster as `brand` (factories enforce msg.sender == brand).
        address broadcaster = msg.sender;

        // ── 0. Platform stablecoin (testnet faucet token) ─────────────
        address usdc = address(new MockUSDC());

        // ── 1. ManaAdmin ──────────────────────────────────────────────
        // Initialize with broadcaster so fee/whitelist calls work in this batch.
        ManaAdmin manaAdminImpl = new ManaAdmin();
        ManaAdmin manaAdmin = ManaAdmin(address(new ERC1967Proxy(
            address(manaAdminImpl),
            abi.encodeCall(ManaAdmin.initialize, (broadcaster))
        )));
        manaAdmin.setFeePrimary(adminCfg.feePrimaryBps);
        manaAdmin.setFeeSecondary(adminCfg.feeSecondaryBps);
        manaAdmin.setFeeRecipient(adminCfg.feeRecipient);

        // ── 2. UUPS implementations ───────────────────────────────────
        BrandGenesisNFT genesisNFTImpl    = new BrandGenesisNFT();
        FractionalVault vaultImpl          = new FractionalVault();
        BrandSupportToken supportTokenImpl = new BrandSupportToken();
        EventTickets eventTicketsImpl      = new EventTickets();

        // ── 3. Factories ──────────────────────────────────────────────
        BrandFactory brandFactory = new BrandFactory(
            IManaAdmin(address(manaAdmin)),
            address(genesisNFTImpl),
            address(vaultImpl),
            address(supportTokenImpl)
        );
        EventFactory eventFactory = new EventFactory(
            IManaAdmin(address(manaAdmin)),
            address(eventTicketsImpl)
        );
        SaleFactory saleFactory = new SaleFactory(
            IManaAdmin(address(manaAdmin)),
            brandFactory,
            eventFactory,
            IERC20(usdc)
        );

        // ── 4. Whitelist broadcaster so factories accept the call ─────
        manaAdmin.setBrandWhitelisted(broadcaster, true);

        // ── 5. Brand module (msg.sender == broadcaster == brand param) ─
        (address genesisNFT, address vault, address supportToken) = brandFactory.deployBrandModule(
            broadcaster,
            brandCfg.nftName,
            brandCfg.nftSymbol,
            brandCfg.tokenName,
            brandCfg.tokenSymbol,
            brandCfg.tokenImageUri,
            brandCfg.totalSupplyCap
        );

        // ── 6. Genesis NFT: mint and lock into the vault ──────────────
        BrandGenesisNFT(genesisNFT).mint(broadcaster, 1, "ipfs://genesis", brandCfg.tokenImageUri);
        BrandGenesisNFT(genesisNFT).approve(vault, 1);
        FractionalVault(vault).depositGenesis(IERC721(genesisNFT), 1);

        // ── 7. Token sale: deploy + fund + link in one call ───────────
        address tokenSaleEscrow = FractionalVault(vault).openSale(
            ISaleFactory(address(saleFactory)),
            tokenSaleCfg.pricePerToken,
            tokenSaleCfg.totalForSale,
            tokenSaleCfg.startTime,
            tokenSaleCfg.endTime
        );

        // ── 8. Event module + ticket sale via SaleFactory ─────────────
        address eventTickets = eventFactory.deployEventModule(broadcaster, eventCfg.uri);
        address ticketSale = saleFactory.deployTicketSale(
            eventTickets,
            ticketSaleCfg.freeEvent,
            ticketSaleCfg.startTime,
            ticketSaleCfg.endTime
        );

        // ── 9. Transfer brand ownership/roles if brand != broadcaster ─
        if (brandCfg.addr != broadcaster) {
            // Vault: OwnableUpgradeable
            FractionalVault(vault).transferOwnership(brandCfg.addr);

            // GenesisNFT: AccessControl — grant to brand, then revoke from broadcaster
            BrandGenesisNFT nft = BrandGenesisNFT(genesisNFT);
            nft.grantRole(ManaRoles.getDefaultAdminRole(), brandCfg.addr);
            nft.grantRole(ManaRoles.getMinterRole(), brandCfg.addr);
            nft.renounceRole(ManaRoles.getMinterRole(), broadcaster);
            nft.renounceRole(ManaRoles.getDefaultAdminRole(), broadcaster);

            // EventTickets: same pattern
            EventTickets tickets = EventTickets(eventTickets);
            tickets.grantRole(ManaRoles.getDefaultAdminRole(), brandCfg.addr);
            tickets.grantRole(ManaRoles.getMinterRole(), brandCfg.addr);
            tickets.renounceRole(ManaRoles.getMinterRole(), broadcaster);
            tickets.renounceRole(ManaRoles.getDefaultAdminRole(), broadcaster);

            // Also whitelist the intended brand address for future event deployments
            manaAdmin.setBrandWhitelisted(brandCfg.addr, true);
        }

        // ── 10. Transfer ManaAdmin roles to intended admin ────────────
        if (adminCfg.addr != broadcaster) {
            manaAdmin.grantRole(ManaRoles.getDefaultAdminRole(), adminCfg.addr);
            manaAdmin.grantRole(ManaRoles.getOperatorRole(), adminCfg.addr);
            manaAdmin.renounceRole(ManaRoles.getDefaultAdminRole(), broadcaster);
            manaAdmin.renounceRole(ManaRoles.getOperatorRole(), broadcaster);
        }

        vm.stopBroadcast();

        // ── Persist all addresses ─────────────────────────────────────
        writeDeployed("mockUSDC",         usdc);
        writeDeployed("manaAdminImpl",    address(manaAdminImpl));
        writeDeployed("manaAdminProxy",   address(manaAdmin));
        writeDeployed("genesisNFTImpl",   address(genesisNFTImpl));
        writeDeployed("vaultImpl",        address(vaultImpl));
        writeDeployed("supportTokenImpl", address(supportTokenImpl));
        writeDeployed("eventTicketsImpl", address(eventTicketsImpl));
        writeDeployed("brandFactory",     address(brandFactory));
        writeDeployed("eventFactory",     address(eventFactory));
        writeDeployed("saleFactory",      address(saleFactory));
        writeDeployed("genesisNFT",       genesisNFT);
        writeDeployed("vault",            vault);
        writeDeployed("supportToken",     supportToken);
        writeDeployed("eventTickets",     eventTickets);
        writeDeployed("tokenSaleEscrow",  tokenSaleEscrow);
        writeDeployed("ticketSale",       ticketSale);

        console.log("=== DeployAll ===");
        console.log("Chain:              ", block.chainid);
        console.log("Broadcaster:        ", broadcaster);
        console.log("Admin:              ", adminCfg.addr);
        console.log("Brand:              ", brandCfg.addr);
        console.log("MockUSDC:           ", usdc);
        console.log("ManaAdmin proxy:    ", address(manaAdmin));
        console.log("BrandFactory:       ", address(brandFactory));
        console.log("EventFactory:       ", address(eventFactory));
        console.log("SaleFactory:        ", address(saleFactory));
        console.log("Genesis NFT:        ", genesisNFT);
        console.log("Vault:              ", vault);
        console.log("Support Token:      ", supportToken);
        console.log("Event Tickets:      ", eventTickets);
        console.log("TokenSaleEscrow:    ", tokenSaleEscrow);
        console.log("TicketSale:         ", ticketSale);
        console.log("Addresses saved to  config/deploy.json");
    }
}
