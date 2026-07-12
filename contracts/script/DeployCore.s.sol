// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ManaAdmin} from "../src/access/ManaAdmin.sol";
import {BrandGenesisNFT} from "../src/brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../src/brand/FractionalVault.sol";
import {BrandSupportToken} from "../src/brand/BrandSupportToken.sol";
import {EventTickets} from "../src/events/EventTickets.sol";
import {BrandFactory} from "../src/factory/BrandFactory.sol";
import {EventFactory} from "../src/factory/EventFactory.sol";
import {SaleFactory} from "../src/factory/SaleFactory.sol";
import {IManaAdmin} from "../src/interfaces/IManaAdmin.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ManaRoles} from "../src/constants/ManaRoles.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Deploys ManaChain core infrastructure:
 *         MockUSDC + ManaAdmin (UUPS proxy) + 4 UUPS implementations
 *         + BrandFactory + EventFactory + SaleFactory.
 *
 *         After this script, an operator must call ManaAdmin.setBrandWhitelisted()
 *         before brands can deploy their modules.
 *
 *         Reads:  config/deploy.json → admin.*
 *         Writes: config/deploy.json → deployed.{mockUSDC, manaAdminImpl, manaAdminProxy,
 *                 genesisNFTImpl, vaultImpl, supportTokenImpl, eventTicketsImpl,
 *                 brandFactory, eventFactory, saleFactory}
 *
 * Run (Fuji):
 *   forge script script/DeployCore.s.sol --rpc-url fuji --broadcast --verify -vvvv
 */
contract DeployCore is DeployConfig {
    function run() external {
        AdminCfg memory cfg = readAdminCfg();

        vm.startBroadcast();

        // Initialize with the broadcaster so fee setters work in this same transaction batch.
        // Roles are transferred to cfg.addr below if it differs from the broadcaster.
        address broadcaster = msg.sender;

        // Platform stablecoin (testnet faucet token)
        MockUSDC usdc = new MockUSDC();

        ManaAdmin manaAdminImpl = new ManaAdmin();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(manaAdminImpl),
            abi.encodeCall(ManaAdmin.initialize, (broadcaster))
        );
        ManaAdmin manaAdmin = ManaAdmin(address(proxy));

        manaAdmin.setFeePrimary(cfg.feePrimaryBps);
        manaAdmin.setFeeSecondary(cfg.feeSecondaryBps);
        manaAdmin.setFeeRecipient(cfg.feeRecipient);

        // Transfer admin control to the intended admin if different from the broadcaster
        if (cfg.addr != broadcaster) {
            manaAdmin.grantRole(ManaRoles.getDefaultAdminRole(), cfg.addr);
            manaAdmin.grantRole(ManaRoles.getOperatorRole(), cfg.addr);
            manaAdmin.renounceRole(ManaRoles.getDefaultAdminRole(), broadcaster);
            manaAdmin.renounceRole(ManaRoles.getOperatorRole(), broadcaster);
        }

        // UUPS implementations — constructors call _disableInitializers()
        BrandGenesisNFT genesisNFTImpl  = new BrandGenesisNFT();
        FractionalVault vaultImpl        = new FractionalVault();
        BrandSupportToken supportTokenImpl = new BrandSupportToken();
        EventTickets eventTicketsImpl    = new EventTickets();

        // Factories
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
            IERC20(address(usdc))
        );

        vm.stopBroadcast();

        // Persist addresses
        writeDeployed("mockUSDC",         address(usdc));
        writeDeployed("manaAdminImpl",    address(manaAdminImpl));
        writeDeployed("manaAdminProxy",   address(manaAdmin));
        writeDeployed("genesisNFTImpl",   address(genesisNFTImpl));
        writeDeployed("vaultImpl",        address(vaultImpl));
        writeDeployed("supportTokenImpl", address(supportTokenImpl));
        writeDeployed("eventTicketsImpl", address(eventTicketsImpl));
        writeDeployed("brandFactory",     address(brandFactory));
        writeDeployed("eventFactory",     address(eventFactory));
        writeDeployed("saleFactory",      address(saleFactory));

        console.log("=== DeployCore ===");
        console.log("Chain:              ", block.chainid);
        console.log("MockUSDC:           ", address(usdc));
        console.log("ManaAdmin impl:     ", address(manaAdminImpl));
        console.log("ManaAdmin proxy:    ", address(manaAdmin));
        console.log("GenesisNFT impl:    ", address(genesisNFTImpl));
        console.log("Vault impl:         ", address(vaultImpl));
        console.log("SupportToken impl:  ", address(supportTokenImpl));
        console.log("EventTickets impl:  ", address(eventTicketsImpl));
        console.log("BrandFactory:       ", address(brandFactory));
        console.log("EventFactory:       ", address(eventFactory));
        console.log("SaleFactory:        ", address(saleFactory));
    }
}
