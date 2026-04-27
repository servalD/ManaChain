// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Script} from "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";

/**
 * @notice Abstract base for all ManaChain deploy scripts.
 *
 * Reads configuration from `config/deploy.json` and writes deployed
 * addresses back to the same file under the `deployed` section.
 *
 * JSON conventions:
 *   - Addresses           → JSON strings  ("0x...")        read via readAddress
 *   - Small integers      → JSON numbers  (BPS, timestamps) read via readUint
 *   - Large token amounts → JSON strings  ("1e18...")       read via readString + vm.parseUint
 *   - Booleans            → JSON booleans                   read via readBool
 */
abstract contract DeployConfig is Script {
    using stdJson for string;

    string internal constant CONFIG_PATH = "config/deploy.json";

    // ── Config structs ─────────────────────────────────────────────────

    struct AdminCfg {
        address addr;
        address feeRecipient;
        uint256 feePrimaryBps;
        uint256 feeSecondaryBps;
    }

    struct BrandCfg {
        address addr;
        string nftName;
        string nftSymbol;
        string tokenName;
        string tokenSymbol;
        string tokenImageUri;
        uint256 totalSupplyCap; // 0 = unlimited
    }

    struct EventCfg {
        string uri;
    }

    struct TokenSaleCfg {
        uint256 pricePerToken; // USDC units (6 decimals)
        uint256 totalForSale;  // support token units (18 decimals)
        uint256 startTime;
        uint256 endTime;
    }

    struct TicketSaleCfg {
        uint256 startTime;
        uint256 endTime;
        bool freeEvent;
    }

    // ── Config readers ─────────────────────────────────────────────────

    function readAdminCfg() internal view returns (AdminCfg memory c) {
        string memory j = vm.readFile(CONFIG_PATH);
        c.addr            = j.readAddress(".admin.address");
        c.feeRecipient    = j.readAddress(".admin.feeRecipient");
        c.feePrimaryBps   = j.readUint(".admin.feePrimaryBps");
        c.feeSecondaryBps = j.readUint(".admin.feeSecondaryBps");
    }

    function readBrandCfg() internal view returns (BrandCfg memory c) {
        string memory j = vm.readFile(CONFIG_PATH);
        c.addr           = j.readAddress(".brand.address");
        c.nftName        = j.readString(".brand.nftName");
        c.nftSymbol      = j.readString(".brand.nftSymbol");
        c.tokenName      = j.readString(".brand.tokenName");
        c.tokenSymbol    = j.readString(".brand.tokenSymbol");
        c.tokenImageUri  = j.readString(".brand.tokenImageUri");
        c.totalSupplyCap = vm.parseUint(j.readString(".brand.totalSupplyCap"));
    }

    function readEventCfg() internal view returns (EventCfg memory c) {
        string memory j = vm.readFile(CONFIG_PATH);
        c.uri = j.readString(".event.uri");
    }

    function readTokenSaleCfg() internal view returns (TokenSaleCfg memory c) {
        string memory j = vm.readFile(CONFIG_PATH);
        c.pricePerToken = vm.parseUint(j.readString(".tokenSale.pricePerToken"));
        c.totalForSale  = vm.parseUint(j.readString(".tokenSale.totalForSale"));
        c.startTime     = j.readUint(".tokenSale.startTime");
        c.endTime       = j.readUint(".tokenSale.endTime");
    }

    function readTicketSaleCfg() internal view returns (TicketSaleCfg memory c) {
        string memory j = vm.readFile(CONFIG_PATH);
        c.startTime = j.readUint(".ticketSale.startTime");
        c.endTime   = j.readUint(".ticketSale.endTime");
        c.freeEvent = j.readBool(".ticketSale.freeEvent");
    }

    // ── Deployed address readers ───────────────────────────────────────

    function readDeployed(string memory key) internal view returns (address) {
        string memory j = vm.readFile(CONFIG_PATH);
        return j.readAddress(string.concat(".deployed.", key));
    }

    // ── Deployed address writer ────────────────────────────────────────

    /// @dev Writes a deployed address to config/deploy.json under `.deployed.<key>`.
    function writeDeployed(string memory key, address addr) internal {
        vm.writeJson(
            string.concat('"', vm.toString(addr), '"'),
            CONFIG_PATH,
            string.concat(".deployed.", key)
        );
    }
}
