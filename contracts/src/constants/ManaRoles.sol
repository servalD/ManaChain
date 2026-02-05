// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/// @title ManaRoles
/// @notice Roles AccessControl (bytes32). Details per contract : README.md
library ManaRoles {
    // ---------- AccessControl role IDs ----------

    /// @dev ManaAdmin, BrandGenesisNFT, EventTickets: upgrade UUPS, grant/revoke roles. From OpenZeppelin AccessControl.
    bytes32 internal constant DEFAULT_ADMIN_ROLE = 0x00;

    /// @dev ManaAdmin: whitelist, blacklist, fees, cancel token sale. Cannot upgrade.
    bytes32 internal constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @dev BrandGenesisNFT, EventTickets: mint tokens.
    bytes32 internal constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ---------- Getters (for use in contracts that import this library) ----------

    function getDefaultAdminRole() internal pure returns (bytes32) {
        return DEFAULT_ADMIN_ROLE;
    }

    function getOperatorRole() internal pure returns (bytes32) {
        return OPERATOR_ROLE;
    }

    function getMinterRole() internal pure returns (bytes32) {
        return MINTER_ROLE;
    }
}
