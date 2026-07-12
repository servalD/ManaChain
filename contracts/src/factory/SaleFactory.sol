// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IManaAdmin} from "../interfaces/IManaAdmin.sol";
import {ISaleFactory} from "../interfaces/ISaleFactory.sol";
import {TokenSaleEscrow} from "../brand/TokenSaleEscrow.sol";
import {TicketSale} from "../events/TicketSale.sol";
import {BrandFactory} from "./BrandFactory.sol";
import {EventFactory} from "./EventFactory.sol";

/**
 * @title SaleFactory
 * @author Mana Chain
 * @notice Deploys platform-recognized sale contracts (TokenSaleEscrow, TicketSale) for whitelisted
 *         brands, pinning the platform stablecoin and reading fees from ManaAdmin. Its events are
 *         the discovery source for the platform indexer: sales deployed outside this factory are
 *         invisible to the platform.
 */
contract SaleFactory is ISaleFactory {
    IManaAdmin public immutable manaAdmin;
    BrandFactory public immutable brandFactory;
    EventFactory public immutable eventFactory;
    /// @notice Platform payment stablecoin (6 decimals).
    IERC20 public immutable usdc;

    error SaleFactoryZeroAddress();
    error SaleFactoryOnlyVault();
    error SaleFactoryOnlyBrand();
    error SaleFactoryBrandNotAllowed();

    event TokenSaleDeployed(
        address indexed brand,
        address indexed escrow,
        address indexed supportToken,
        uint256 pricePerToken,
        uint256 totalForSale,
        uint256 startTime,
        uint256 endTime
    );
    event TicketSaleDeployed(
        address indexed brand,
        address indexed ticketSale,
        address indexed eventTickets,
        address paymentToken,
        uint256 startTime,
        uint256 endTime
    );

    constructor(IManaAdmin manaAdmin_, BrandFactory brandFactory_, EventFactory eventFactory_, IERC20 usdc_) {
        if (
            address(manaAdmin_) == address(0) || address(brandFactory_) == address(0)
                || address(eventFactory_) == address(0) || address(usdc_) == address(0)
        ) revert SaleFactoryZeroAddress();
        manaAdmin = manaAdmin_;
        brandFactory = brandFactory_;
        eventFactory = eventFactory_;
        usdc = usdc_;
    }

    /// @inheritdoc ISaleFactory
    /// @dev Caller must be the brand's vault (BrandFactory registry): FractionalVault.openSale()
    ///      is the only legitimate path, which also funds the escrow and links it to the vault.
    function deployTokenSale(
        address brand,
        uint256 pricePerToken,
        uint256 totalForSale,
        uint256 startTime,
        uint256 endTime
    ) external returns (address escrow) {
        if (brand == address(0) || brandFactory.vaultOf(brand) != msg.sender) revert SaleFactoryOnlyVault();
        if (!manaAdmin.isBrandAllowed(brand)) revert SaleFactoryBrandNotAllowed();

        escrow = address(
            new TokenSaleEscrow(
                IERC20(brandFactory.supportTokenOf(brand)),
                usdc,
                brand,
                address(manaAdmin),
                manaAdmin.getFeeRecipient(),
                pricePerToken,
                totalForSale,
                startTime,
                endTime,
                uint16(manaAdmin.getFeePrimary())
            )
        );

        emit TokenSaleDeployed(
            brand, escrow, brandFactory.supportTokenOf(brand), pricePerToken, totalForSale, startTime, endTime
        );
    }

    /// @inheritdoc ISaleFactory
    /// @dev Caller must be the brand that deployed `eventTickets` (EventFactory registry).
    ///      The brand must then mint tickets to the sale and set prices.
    function deployTicketSale(
        address eventTickets,
        bool freeEvent,
        uint256 startTime,
        uint256 endTime
    ) external returns (address ticketSale) {
        address brand = eventFactory.brandOfEventTickets(eventTickets);
        if (brand == address(0) || msg.sender != brand) revert SaleFactoryOnlyBrand();
        if (!manaAdmin.isBrandAllowed(brand)) revert SaleFactoryBrandNotAllowed();

        address paymentToken = freeEvent ? address(0) : address(usdc);
        uint16 feeBps = freeEvent ? 0 : uint16(manaAdmin.getFeePrimary());

        ticketSale = address(
            new TicketSale(
                IERC1155(eventTickets),
                IERC20(paymentToken),
                brand,
                manaAdmin.getFeeRecipient(),
                feeBps,
                startTime,
                endTime
            )
        );

        emit TicketSaleDeployed(brand, ticketSale, eventTickets, paymentToken, startTime, endTime);
    }
}
