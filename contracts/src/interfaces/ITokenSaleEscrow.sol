// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITokenSaleEscrow
 * @author Mana Chain
 * @notice Interface for the token sale escrow contract so ManaAdmin can trigger sale cancellation.
 * @dev After cancellation, token holders can claim on-chain refunds; the brand cannot claim funds.
 */
interface ITokenSaleEscrow {
    /**
     * @notice Cancels the sale and enables refunds for token holders.
     * @dev Only callable by the ManaAdmin contract. After this call, token holders can claim refunds
     *      and the brand can no longer claim escrowed funds.
     */
    function cancelSaleByAdmin() external;
}
