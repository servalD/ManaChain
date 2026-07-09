// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {TokenSaleEscrow} from "../src/brand/TokenSaleEscrow.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Deploys a TokenSaleEscrow for primary sale of BrandSupportToken in USDC.
 *
 *         After deployment, the brand must transfer `tokenSale.totalForSale` support
 *         tokens to the escrow address for the sale to become effective.
 *
 *         Reads:  config/deploy.json → admin.feeRecipient, admin.feePrimaryBps,
 *                 brand.address, tokenSale.*, deployed.{manaAdminProxy, supportToken}
 *         Writes: config/deploy.json → deployed.tokenSaleEscrow
 *
 * Run (Base Sepolia):
 *   forge script script/DeployTokenSaleEscrow.s.sol --rpc-url base_sepolia --broadcast --verify -vvvv
 */
contract DeployTokenSaleEscrow is DeployConfig {
    function run() external {
        AdminCfg memory adminCfg = readAdminCfg();
        TokenSaleCfg memory saleCfg = readTokenSaleCfg();
        address brand = readBrandCfg().addr;
        address manaAdmin = readDeployed("manaAdminProxy");
        address supportToken = readDeployed("supportToken");
        address usdc = readDeployed("mockUSDC");

        vm.startBroadcast();
        TokenSaleEscrow escrow = new TokenSaleEscrow(
            IERC20(supportToken),
            IERC20(usdc),
            brand,
            manaAdmin,
            adminCfg.feeRecipient,
            saleCfg.pricePerToken,
            saleCfg.totalForSale,
            saleCfg.startTime,
            saleCfg.endTime,
            uint16(adminCfg.feePrimaryBps)
        );
        vm.stopBroadcast();

        writeDeployed("tokenSaleEscrow", address(escrow));

        console.log("=== DeployTokenSaleEscrow ===");
        console.log("Escrow:         ", address(escrow));
        console.log("Support Token:  ", supportToken);
        console.log("Payment (USDC): ", usdc);
        console.log("Brand:          ", brand);
        console.log("Price/token:    ", saleCfg.pricePerToken);
        console.log("Total for sale: ", saleCfg.totalForSale);
        console.log("Start:          ", saleCfg.startTime);
        console.log("End:            ", saleCfg.endTime);
        console.log("Fee (bps):      ", adminCfg.feePrimaryBps);
        console.log("");
        console.log("ACTION: transfer support tokens to escrow:", address(escrow));
    }
}
