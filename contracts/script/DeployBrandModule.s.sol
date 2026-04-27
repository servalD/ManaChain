// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {BrandFactory} from "../src/factory/BrandFactory.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Brand deploys its full module (Genesis NFT + Vault + Support Token)
 *         via BrandFactory. The brand must be whitelisted on ManaAdmin first.
 *
 *         The broadcaster must be the brand address (BrandFactory checks msg.sender == brand).
 *
 *         Reads:  config/deploy.json → brand.*, deployed.brandFactory
 *         Writes: config/deploy.json → deployed.{genesisNFT, vault, supportToken}
 *
 * Run (Base Sepolia):
 *   forge script script/DeployBrandModule.s.sol --rpc-url base_sepolia --broadcast --verify -vvvv
 */
contract DeployBrandModule is DeployConfig {
    function run() external {
        BrandCfg memory brand = readBrandCfg();
        BrandFactory factory = BrandFactory(readDeployed("brandFactory"));

        vm.startBroadcast();
        (address genesisNFT, address vault, address supportToken) = factory.deployBrandModule(
            brand.addr,
            brand.nftName,
            brand.nftSymbol,
            brand.tokenName,
            brand.tokenSymbol,
            brand.tokenImageUri,
            brand.totalSupplyCap
        );
        vm.stopBroadcast();

        writeDeployed("genesisNFT",   genesisNFT);
        writeDeployed("vault",        vault);
        writeDeployed("supportToken", supportToken);

        console.log("=== DeployBrandModule ===");
        console.log("Brand:          ", brand.addr);
        console.log("Genesis NFT:    ", genesisNFT);
        console.log("Vault:          ", vault);
        console.log("Support Token:  ", supportToken);
    }
}
