// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ManaAdmin} from "../src/access/ManaAdmin.sol";
import {BrandGenesisNFT} from "../src/brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../src/brand/FractionalVault.sol";
import {BrandSupportToken} from "../src/brand/BrandSupportToken.sol";
import {TokenSaleEscrow} from "../src/brand/TokenSaleEscrow.sol";
import {EventTickets} from "../src/events/EventTickets.sol";
import {TicketSale} from "../src/events/TicketSale.sol";
import {BrandFactory, IManaAdmin as IBrandAdmin} from "../src/factory/BrandFactory.sol";
import {EventFactory, IManaAdmin as IEventAdmin} from "../src/factory/EventFactory.sol";
import {BaseStablecoins} from "../src/constants/BaseStablecoins.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice One-shot deployment: core infra + brand module + event module + token sale + ticket sale.
 *
 * CONSTRAINT: `admin.address`, `brand.address`, and the broadcaster (private key)
 * must all be the SAME address. This is because:
 *   - BrandFactory and EventFactory require msg.sender == brand.
 *   - ManaAdmin operations (whitelist, fees) require OPERATOR_ROLE == admin.
 * For production, run the individual scripts separately with the appropriate keys.
 *
 * Reads:  config/deploy.json → all sections
 * Writes: config/deploy.json → deployed.* (all addresses)
 *
 * Run (Base Sepolia):
 *   forge script script/DeployAll.s.sol --rpc-url base_sepolia --broadcast --verify -vvvv
 */
contract DeployAll is DeployConfig {
    function run() external {
        AdminCfg memory adminCfg = readAdminCfg();
        BrandCfg memory brandCfg = readBrandCfg();
        EventCfg memory eventCfg = readEventCfg();
        TokenSaleCfg memory tokenSaleCfg = readTokenSaleCfg();
        TicketSaleCfg memory ticketSaleCfg = readTicketSaleCfg();

        require(
            adminCfg.addr == brandCfg.addr,
            "DeployAll: admin.address must equal brand.address (same broadcaster)"
        );

        address usdc = block.chainid == BaseStablecoins.CHAIN_ID_BASE_MAINNET
            ? BaseStablecoins.USDC_BASE_MAINNET
            : BaseStablecoins.USDC_BASE_TESTNET;

        vm.startBroadcast();

        // ── 1. ManaAdmin ──────────────────────────────────────────────
        ManaAdmin manaAdminImpl = new ManaAdmin();
        ManaAdmin manaAdmin = ManaAdmin(address(new ERC1967Proxy(
            address(manaAdminImpl),
            abi.encodeCall(ManaAdmin.initialize, (adminCfg.addr))
        )));
        manaAdmin.setFeePrimary(adminCfg.feePrimaryBps);
        manaAdmin.setFeeSecondary(adminCfg.feeSecondaryBps);
        manaAdmin.setFeeRecipient(adminCfg.feeRecipient);

        // ── 2. Implementations ────────────────────────────────────────
        BrandGenesisNFT genesisNFTImpl   = new BrandGenesisNFT();
        FractionalVault vaultImpl         = new FractionalVault();
        BrandSupportToken supportTokenImpl = new BrandSupportToken();
        EventTickets eventTicketsImpl     = new EventTickets();

        // ── 3. Factories ──────────────────────────────────────────────
        BrandFactory brandFactory = new BrandFactory(
            IBrandAdmin(address(manaAdmin)),
            address(genesisNFTImpl),
            address(vaultImpl),
            address(supportTokenImpl)
        );
        EventFactory eventFactory = new EventFactory(
            IEventAdmin(address(manaAdmin)),
            address(eventTicketsImpl)
        );

        // ── 4. Whitelist brand (admin == brand == broadcaster) ────────
        manaAdmin.setBrandWhitelisted(brandCfg.addr, true);

        // ── 5. Brand module ───────────────────────────────────────────
        (address genesisNFT, address vault, address supportToken) = brandFactory.deployBrandModule(
            brandCfg.addr,
            brandCfg.nftName,
            brandCfg.nftSymbol,
            brandCfg.tokenName,
            brandCfg.tokenSymbol,
            brandCfg.tokenImageUri,
            brandCfg.totalSupplyCap
        );

        // ── 6. Event module ───────────────────────────────────────────
        address eventTickets = eventFactory.deployEventModule(brandCfg.addr, eventCfg.uri);

        // ── 7. Token sale escrow ──────────────────────────────────────
        TokenSaleEscrow tokenSaleEscrow = new TokenSaleEscrow(
            IERC20(supportToken),
            IERC20(usdc),
            brandCfg.addr,
            address(manaAdmin),
            adminCfg.feeRecipient,
            tokenSaleCfg.pricePerToken,
            tokenSaleCfg.totalForSale,
            tokenSaleCfg.startTime,
            tokenSaleCfg.endTime,
            uint16(adminCfg.feePrimaryBps)
        );

        // ── 8. Ticket sale ────────────────────────────────────────────
        address ticketPaymentToken;
        uint16 ticketFeeBps;
        if (ticketSaleCfg.freeEvent) {
            ticketPaymentToken = address(0);
            ticketFeeBps = 0;
        } else {
            ticketPaymentToken = usdc;
            ticketFeeBps = uint16(adminCfg.feePrimaryBps);
        }
        TicketSale ticketSale = new TicketSale(
            IERC1155(eventTickets),
            IERC20(ticketPaymentToken),
            brandCfg.addr,
            adminCfg.feeRecipient,
            ticketFeeBps,
            ticketSaleCfg.startTime,
            ticketSaleCfg.endTime
        );

        vm.stopBroadcast();

        // ── Persist all addresses ─────────────────────────────────────
        writeDeployed("manaAdminImpl",    address(manaAdminImpl));
        writeDeployed("manaAdminProxy",   address(manaAdmin));
        writeDeployed("genesisNFTImpl",   address(genesisNFTImpl));
        writeDeployed("vaultImpl",        address(vaultImpl));
        writeDeployed("supportTokenImpl", address(supportTokenImpl));
        writeDeployed("eventTicketsImpl", address(eventTicketsImpl));
        writeDeployed("brandFactory",     address(brandFactory));
        writeDeployed("eventFactory",     address(eventFactory));
        writeDeployed("genesisNFT",       genesisNFT);
        writeDeployed("vault",            vault);
        writeDeployed("supportToken",     supportToken);
        writeDeployed("eventTickets",     eventTickets);
        writeDeployed("tokenSaleEscrow",  address(tokenSaleEscrow));
        writeDeployed("ticketSale",       address(ticketSale));

        // ── Summary ───────────────────────────────────────────────────
        console.log("=== DeployAll ===");
        console.log("Chain:              ", block.chainid);
        console.log("Admin / Brand:      ", adminCfg.addr);
        console.log("ManaAdmin proxy:    ", address(manaAdmin));
        console.log("BrandFactory:       ", address(brandFactory));
        console.log("EventFactory:       ", address(eventFactory));
        console.log("Genesis NFT:        ", genesisNFT);
        console.log("Vault:              ", vault);
        console.log("Support Token:      ", supportToken);
        console.log("Event Tickets:      ", eventTickets);
        console.log("TokenSaleEscrow:    ", address(tokenSaleEscrow));
        console.log("TicketSale:         ", address(ticketSale));
        console.log("");
        console.log("Addresses saved to config/deploy.json");
    }
}
