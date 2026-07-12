// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/**
 * @title ISaleFactory
 * @author Mana Chain
 * @notice Interface of the factory that deploys platform-recognized sale contracts.
 * @dev FractionalVault.openSale() calls deployTokenSale; the brand calls deployTicketSale directly.
 */
interface ISaleFactory {
    /**
     * @notice Deploys a TokenSaleEscrow for `brand`. Caller must be the brand's vault (registered in BrandFactory).
     * @param brand Brand address (owner of the calling vault).
     * @param pricePerToken Price in payment-token units (6 decimals) per whole support token.
     * @param totalForSale Support tokens for sale, in base units (18 decimals).
     * @param startTime Sale start timestamp.
     * @param endTime Sale end timestamp.
     * @return escrow The deployed TokenSaleEscrow address.
     */
    function deployTokenSale(
        address brand,
        uint256 pricePerToken,
        uint256 totalForSale,
        uint256 startTime,
        uint256 endTime
    ) external returns (address escrow);

    /**
     * @notice Deploys a TicketSale for an EventTickets contract. Caller must be the brand that deployed it (registered in EventFactory).
     * @param eventTickets EventTickets (ERC-1155) address deployed via EventFactory.
     * @param freeEvent True for a free-only event (no payment token, zero fee).
     * @param startTime Sale start timestamp.
     * @param endTime Sale end timestamp.
     * @return ticketSale The deployed TicketSale address.
     */
    function deployTicketSale(
        address eventTickets,
        bool freeEvent,
        uint256 startTime,
        uint256 endTime
    ) external returns (address ticketSale);
}
