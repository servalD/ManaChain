// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ManaAdmin} from "../src/access/ManaAdmin.sol";
import {BrandGenesisNFT} from "../src/brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../src/brand/FractionalVault.sol";
import {BrandSupportToken} from "../src/brand/BrandSupportToken.sol";
import {EventTickets} from "../src/events/EventTickets.sol";
import {BrandFactory, IManaAdmin as IBrandAdmin} from "../src/factory/BrandFactory.sol";
import {EventFactory, IManaAdmin as IEventAdmin} from "../src/factory/EventFactory.sol";
import {ManaRoles} from "../src/constants/ManaRoles.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Deploys ManaChain core infrastructure:
 *         ManaAdmin (UUPS proxy) + 4 UUPS implementations + BrandFactory + EventFactory.
 *
 *         After this script, an operator must call ManaAdmin.setBrandWhitelisted()
 *         before brands can deploy their modules.
 *
 *         Reads:  config/deploy.json → admin.*
 *         Writes: config/deploy.json → deployed.{manaAdminImpl, manaAdminProxy,
 *                 genesisNFTImpl, vaultImpl, supportTokenImpl, eventTicketsImpl,
 *                 brandFactory, eventFactory}
 *
 * Run (Base Sepolia):
 *   forge script script/DeployCore.s.sol --rpc-url base_sepolia --broadcast --verify -vvvv
 */
contract DeployCore is DeployConfig {
    function run() external {
        AdminCfg memory cfg = readAdminCfg();

        vm.startBroadcast();

        // Initialize with the broadcaster so fee setters work in this same transaction batch.
        // Roles are transferred to cfg.addr below if it differs from the broadcaster.
        address broadcaster = msg.sender;

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
            IBrandAdmin(address(manaAdmin)),
            address(genesisNFTImpl),
            address(vaultImpl),
            address(supportTokenImpl)
        );
        EventFactory eventFactory = new EventFactory(
            IEventAdmin(address(manaAdmin)),
            address(eventTicketsImpl)
        );

        vm.stopBroadcast();

        // Persist addresses
        writeDeployed("manaAdminImpl",    address(manaAdminImpl));
        writeDeployed("manaAdminProxy",   address(manaAdmin));
        writeDeployed("genesisNFTImpl",   address(genesisNFTImpl));
        writeDeployed("vaultImpl",        address(vaultImpl));
        writeDeployed("supportTokenImpl", address(supportTokenImpl));
        writeDeployed("eventTicketsImpl", address(eventTicketsImpl));
        writeDeployed("brandFactory",     address(brandFactory));
        writeDeployed("eventFactory",     address(eventFactory));

        console.log("=== DeployCore ===");
        console.log("Chain:              ", block.chainid);
        console.log("ManaAdmin impl:     ", address(manaAdminImpl));
        console.log("ManaAdmin proxy:    ", address(manaAdmin));
        console.log("GenesisNFT impl:    ", address(genesisNFTImpl));
        console.log("Vault impl:         ", address(vaultImpl));
        console.log("SupportToken impl:  ", address(supportTokenImpl));
        console.log("EventTickets impl:  ", address(eventTicketsImpl));
        console.log("BrandFactory:       ", address(brandFactory));
        console.log("EventFactory:       ", address(eventFactory));
    }
}
