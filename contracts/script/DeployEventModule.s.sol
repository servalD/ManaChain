// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {EventFactory} from "../src/factory/EventFactory.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Brand deploys an EventTickets contract (ERC-1155) via EventFactory.
 *         The brand must be whitelisted on ManaAdmin first.
 *         Multiple events can be deployed per brand (one per call).
 *
 *         The broadcaster must be the brand address (EventFactory checks msg.sender == brand).
 *
 *         Reads:  config/deploy.json → brand.address, event.uri, deployed.eventFactory
 *         Writes: config/deploy.json → deployed.eventTickets
 *
 * Run (Base Sepolia):
 *   forge script script/DeployEventModule.s.sol --rpc-url base_sepolia --broadcast --verify -vvvv
 */
contract DeployEventModule is DeployConfig {
    function run() external {
        address brand = readBrandCfg().addr;
        EventCfg memory eventCfg = readEventCfg();
        EventFactory factory = EventFactory(readDeployed("eventFactory"));

        vm.startBroadcast();
        address eventTickets = factory.deployEventModule(brand, eventCfg.uri);
        vm.stopBroadcast();

        writeDeployed("eventTickets", eventTickets);

        console.log("=== DeployEventModule ===");
        console.log("Brand:         ", brand);
        console.log("EventTickets:  ", eventTickets);
        console.log("Metadata URI:  ", eventCfg.uri);
        console.log("");
        console.log("NEXT: Mint ticket types to a TicketSale contract");
    }
}
