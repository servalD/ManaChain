// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {ManaAdmin} from "../src/access/ManaAdmin.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Upgrades the ManaAdmin proxy to a new implementation (UUPS).
 *         The broadcaster must hold DEFAULT_ADMIN_ROLE on the proxy.
 *
 *         Reads:  config/deploy.json → deployed.manaAdminProxy
 *         Writes: config/deploy.json → deployed.manaAdminImpl (new implementation)
 *
 * Run (Base Sepolia):
 *   forge script script/UpgradeManaAdmin.s.sol --rpc-url base_sepolia --broadcast --verify -vvvv
 */
contract UpgradeManaAdmin is DeployConfig {
    function run() external {
        address proxy = readDeployed("manaAdminProxy");

        vm.startBroadcast();
        ManaAdmin newImpl = new ManaAdmin();
        ManaAdmin(proxy).upgradeToAndCall(address(newImpl), "");
        vm.stopBroadcast();

        writeDeployed("manaAdminImpl", address(newImpl));

        console.log("=== UpgradeManaAdmin ===");
        console.log("Proxy:     ", proxy);
        console.log("New impl:  ", address(newImpl));
    }
}
