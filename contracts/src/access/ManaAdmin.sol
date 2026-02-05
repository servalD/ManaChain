// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ITokenSaleEscrow} from "../interfaces/ITokenSaleEscrow.sol";
import {ManaRoles} from "../constants/ManaRoles.sol";

/**
 * @title ManaAdmin
 * @dev Central admin contract for Mana Chain: whitelist/blacklist brands, fees, cancel token sales (enables on-chain refunds).
 *      Upgradeable via UUPS; only DEFAULT_ADMIN_ROLE can upgrade. OPERATOR_ROLE can manage brands and cancel sales but cannot upgrade.
 */
contract ManaAdmin is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    /// @dev Operator can whitelist, blacklist, set fees, cancel sales. Cannot upgrade or grant DEFAULT_ADMIN_ROLE. See ManaRoles.

    /// @dev Fee in basis points (e.g. 500 = 5%). Applied to primary sales (support token, tickets).
    uint256 private _feePercentPrimary;

    /// @dev Fee in basis points for secondary sales (e.g. marketplace). Optional, can be 0.
    uint256 private _feePercentSecondary;

    /// @dev Address that receives platform fees.
    address private _feeRecipient;

    /// @dev Brand address => allowed to deploy / use brand contracts.
    mapping(address => bool) private _whitelist;
    
    /// @dev Brand address => banned (sale can be cancelled, no new deployments).
    mapping(address => bool) private _blacklist;

    /// @dev Reserve storage for future upgrades (append-only).
    uint256[45] private __gap;

    event BrandWhitelisted(address indexed brand, bool allowed);
    event BrandBlacklisted(address indexed brand, bool banned);
    event FeePrimaryUpdated(uint256 oldBps, uint256 newBps);
    event FeeSecondaryUpdated(uint256 oldBps, uint256 newBps);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event TokenSaleCancelled(address indexed escrow);

    error ManaAdminZeroAddress();
    error ManaAdminFeeExceedsMax(uint256 bps);

    /**
     * @dev Disables initializers so the implementation contract cannot be initialized (only the proxy can call {initialize}).
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the ManaAdmin contract. Must be called once after deployment via proxy (e.g. ERC1967Proxy).
     * @dev Sets up access control: grants DEFAULT_ADMIN_ROLE and OPERATOR_ROLE to `admin`. Reverts if admin is zero address.
     * @param admin Address that receives DEFAULT_ADMIN_ROLE (can upgrade, grant/revoke roles) and OPERATOR_ROLE (can whitelist, blacklist, set fees, cancel sales).
     */
    function initialize(address admin) external initializer {
        if (admin == address(0)) revert ManaAdminZeroAddress();
        __AccessControl_init();
        _grantRole(ManaRoles.getDefaultAdminRole(), admin);
        // Optionally grant OPERATOR_ROLE to admin so one address can do everything initially
        _grantRole(ManaRoles.getOperatorRole(), admin);
    }

    /// @notice Returns the OPERATOR_ROLE id (for use with hasRole, etc.). See ManaRoles.
    function OPERATOR_ROLE() external pure returns (bytes32) {
        return ManaRoles.getOperatorRole();
    }

    // ---------- Whitelist / Blacklist ----------

    /**
     * @notice Adds or removes a brand from the whitelist.
     * @dev Only accounts with OPERATOR_ROLE can call. Whitelisted brands are allowed to deploy and use brand contracts (Genesis NFT, Vault, ERC-20, Escrow).
     * @param brand Address identifying the brand (e.g. brand owner or delegated wallet).
     * @param allowed True to whitelist, false to remove from whitelist.
     */
    function setBrandWhitelisted(address brand, bool allowed) external onlyRole(ManaRoles.getOperatorRole()) {
        _whitelist[brand] = allowed;
        emit BrandWhitelisted(brand, allowed);
    }

    /**
     * @notice Adds or removes a brand from the blacklist.
     * @dev Only accounts with OPERATOR_ROLE can call. Blacklisted brands cannot deploy new contracts; existing sales can be cancelled to enable refunds.
     * @param brand Address identifying the brand.
     * @param banned True to blacklist, false to remove from blacklist.
     */
    function setBrandBlacklisted(address brand, bool banned) external onlyRole(ManaRoles.getOperatorRole()) {
        _blacklist[brand] = banned;
        emit BrandBlacklisted(brand, banned);
    }

    /**
     * @notice Returns whether a brand is on the whitelist.
     * @param brand Address to check.
     * @return True if the brand is whitelisted.
     */
    function isBrandWhitelisted(address brand) external view returns (bool) {
        return _whitelist[brand];
    }

    /**
     * @notice Returns whether a brand is on the blacklist.
     * @param brand Address to check.
     * @return True if the brand is blacklisted.
     */
    function isBrandBlacklisted(address brand) external view returns (bool) {
        return _blacklist[brand];
    }

    /**
     * @notice Returns whether a brand is allowed to deploy and use brand contracts.
     * @dev True only if whitelisted and not blacklisted. Used by BrandFactory before deploying.
     * @param brand Address to check.
     * @return True if the brand can deploy/use (whitelisted and not blacklisted).
     */
    function isBrandAllowed(address brand) external view returns (bool) {
        return _whitelist[brand] && !_blacklist[brand];
    }

    // ---------- Fees ----------

    /**
     * @notice Sets the platform fee for primary sales (support token and ticket sales).
     * @dev Fee is in basis points (e.g. 500 = 5%). Maximum 10000 (100%). Only OPERATOR_ROLE.
     * @param bps Fee in basis points (max 10000).
     */
    function setFeePrimary(uint256 bps) external onlyRole(ManaRoles.getOperatorRole()) {
        if (bps > 10000) revert ManaAdminFeeExceedsMax(bps);
        uint256 old = _feePercentPrimary;
        _feePercentPrimary = bps;
        emit FeePrimaryUpdated(old, bps);
    }

    /**
     * @notice Sets the platform fee for secondary sales (e.g. marketplace resales).
     * @dev Fee is in basis points (e.g. 250 = 2.5%). Maximum 10000 (100%). Only OPERATOR_ROLE.
     * @param bps Fee in basis points (max 10000).
     */
    function setFeeSecondary(uint256 bps) external onlyRole(ManaRoles.getOperatorRole()) {
        if (bps > 10000) revert ManaAdminFeeExceedsMax(bps);
        uint256 old = _feePercentSecondary;
        _feePercentSecondary = bps;
        emit FeeSecondaryUpdated(old, bps);
    }

    /**
     * @notice Sets the address that receives platform fees.
     * @dev Only OPERATOR_ROLE. Reverts if recipient is zero address.
     * @param recipient Address that will receive fees from primary and secondary sales.
     */
    function setFeeRecipient(address recipient) external onlyRole(ManaRoles.getOperatorRole()) {
        if (recipient == address(0)) revert ManaAdminZeroAddress();
        address old = _feeRecipient;
        _feeRecipient = recipient;
        emit FeeRecipientUpdated(old, recipient);
    }

    /**
     * @notice Returns the current primary sale fee in basis points.
     * @return Fee in basis points (e.g. 500 = 5%).
     */
    function getFeePrimary() external view returns (uint256) {
        return _feePercentPrimary;
    }

    /**
     * @notice Returns the current secondary sale fee in basis points.
     * @return Fee in basis points (e.g. 250 = 2.5%).
     */
    function getFeeSecondary() external view returns (uint256) {
        return _feePercentSecondary;
    }

    /**
     * @notice Returns the address that receives platform fees.
     * @return Current fee recipient address.
     */
    function getFeeRecipient() external view returns (address) {
        return _feeRecipient;
    }

    // ---------- Cancel token sale ----------

    /**
     * @notice Cancels a token sale escrow, enabling on-chain refunds for token holders.
     * @dev Only OPERATOR_ROLE. Calls {ITokenSaleEscrow.cancelSaleByAdmin} on the given escrow. The escrow must treat this contract (msg.sender) as the authorized admin. After cancellation, the brand cannot claim funds; holders can call refund on the escrow.
     * @param escrow The TokenSaleEscrow contract to cancel.
     */
    function cancelTokenSale(ITokenSaleEscrow escrow) external onlyRole(ManaRoles.getOperatorRole()) {
        escrow.cancelSaleByAdmin();
        emit TokenSaleCancelled(address(escrow));
    }

    // ---------- UUPS ----------

    /**
     * @dev Authorizes an upgrade of the proxy implementation. Only DEFAULT_ADMIN_ROLE can upgrade.
     * @param newImplementation Address of the new implementation contract (unused in check but required by interface).
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ManaRoles.getDefaultAdminRole()) {}
}
