// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {TicketSale} from "../src/events/TicketSale.sol";
import {BaseStablecoins} from "../src/constants/BaseStablecoins.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Deploys a TicketSale for primary sale of EventTickets (ERC-1155).
 *
 *         After deployment the brand must:
 *           1. Mint ticket types to the TicketSale contract address.
 *           2. Call TicketSale.setPrice(tokenId, price) for each ticket type.
 *
 *         Reads:  config/deploy.json → admin.{feeRecipient, feePrimaryBps},
 *                 brand.address, ticketSale.*, deployed.eventTickets
 *         Writes: config/deploy.json → deployed.ticketSale
 *
 * Run (Base Sepolia):
 *   forge script script/DeployTicketSale.s.sol --rpc-url base_sepolia --broadcast --verify -vvvv
 */
contract DeployTicketSale is DeployConfig {
    function run() external {
        AdminCfg memory adminCfg = readAdminCfg();
        TicketSaleCfg memory saleCfg = readTicketSaleCfg();
        address brand = readBrandCfg().addr;
        address eventTickets = readDeployed("eventTickets");

        address paymentToken;
        uint16 effectiveFeeBps;

        if (saleCfg.freeEvent) {
            paymentToken   = address(0);
            effectiveFeeBps = 0;
        } else {
            paymentToken = block.chainid == BaseStablecoins.CHAIN_ID_BASE_MAINNET
                ? BaseStablecoins.USDC_BASE_MAINNET
                : BaseStablecoins.USDC_BASE_TESTNET;
            effectiveFeeBps = uint16(adminCfg.feePrimaryBps);
        }

        vm.startBroadcast();
        TicketSale sale = new TicketSale(
            IERC1155(eventTickets),
            IERC20(paymentToken),
            brand,
            adminCfg.feeRecipient,
            effectiveFeeBps,
            saleCfg.startTime,
            saleCfg.endTime
        );
        vm.stopBroadcast();

        writeDeployed("ticketSale", address(sale));

        console.log("=== DeployTicketSale ===");
        console.log("TicketSale:    ", address(sale));
        console.log("EventTickets:  ", eventTickets);
        console.log("Payment token: ", paymentToken);
        console.log("Brand:         ", brand);
        console.log("Fee (bps):     ", effectiveFeeBps);
        console.log("Start:         ", saleCfg.startTime);
        console.log("End:           ", saleCfg.endTime);
        console.log("");
        console.log("ACTION 1: mint ticket types to TicketSale:", address(sale));
        console.log("ACTION 2: call setPrice(tokenId, price) per ticket type");
    }
}
