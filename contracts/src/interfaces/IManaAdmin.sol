// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/**
 * @title IManaAdmin
 * @author Mana Chain
 * @notice Shared interface for the ManaAdmin access-control contract, used by the factories.
 */
interface IManaAdmin {
    /// @notice True if the brand is whitelisted and not blacklisted.
    function isBrandAllowed(address brand) external view returns (bool);

    /// @notice Primary-sale platform fee in basis points (max 10000).
    function getFeePrimary() external view returns (uint256);

    /// @notice Secondary-sale platform fee in basis points (max 10000).
    function getFeeSecondary() external view returns (uint256);

    /// @notice Recipient of platform fees.
    function getFeeRecipient() external view returns (address);
}
