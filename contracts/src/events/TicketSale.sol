// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/**
 * @title TicketSale
 * @author Mana Chain
 * @notice Primary sale of event tickets (ERC-1155). Payment in the platform stablecoin or free (price 0). Funds to brand minus platform fee.
 * @dev Brand must mint tickets to this contract before sale — TicketSale is an ERC1155Holder so safe mints/transfers to it are accepted. The payment token is injected at deployment (pinned by SaleFactory for platform-recognized sales) or address(0) for free-only events.
 */
contract TicketSale is ReentrancyGuard, ERC1155Holder {
    using SafeERC20 for IERC20;

    IERC1155 public immutable eventTickets;
    IERC20 public immutable paymentToken;
    address public immutable brand;
    address public immutable feeRecipient;
    uint16 public immutable feeBps;
    uint256 public immutable startTime;
    uint256 public immutable endTime;

    /// @dev tokenId => price in payment-token units (0 = free).
    mapping(uint256 => uint256) private _pricePerTicket;
    /// @dev tokenId => whether price has been set (allows distinguishing 0 price from unset).
    mapping(uint256 => bool) private _priceSet;

    error TicketSaleInvalidConfig();
    error TicketSaleOnlyUSDCOrFree();
    error TicketSaleOnlyBrand();
    error TicketSaleNotOpen();
    error TicketSaleTimeWindow();
    error TicketSaleInsufficientBalance();
    error TicketSaleZeroQuantity();
    error TicketSalePriceNotSet();

    event PriceSet(uint256 indexed tokenId, uint256 price);
    event Bought(address indexed buyer, uint256 indexed tokenId, uint256 quantity, uint256 paid);

    /**
     * @param eventTickets_ ERC-1155 event tickets contract. This contract must hold the tickets to sell (brand mints to this).
     * @param paymentToken_ Platform stablecoin (6 decimals) or address(0) for free-only event (all prices must be 0).
     * @param brand_ Address that receives proceeds (minus fee).
     * @param feeRecipient_ Platform fee recipient.
     * @param feeBps_ Fee in basis points (e.g. 500 = 5%). Max 10000.
     * @param startTime_ Sale start.
     * @param endTime_ Sale end.
     */
    constructor(
        IERC1155 eventTickets_,
        IERC20 paymentToken_,
        address brand_,
        address feeRecipient_,
        uint16 feeBps_,
        uint256 startTime_,
        uint256 endTime_
    ) {
        if (
            address(eventTickets_) == address(0) || brand_ == address(0) || feeRecipient_ == address(0)
        ) revert TicketSaleInvalidConfig();
        if (endTime_ <= startTime_ || feeBps_ > 10000) revert TicketSaleInvalidConfig();
        if (address(paymentToken_) == address(0) && feeBps_ != 0) revert TicketSaleInvalidConfig();

        eventTickets = eventTickets_;
        paymentToken = paymentToken_;
        brand = brand_;
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
        startTime = startTime_;
        endTime = endTime_;
    }

    /**
     * @notice Sets the price for a ticket type. Only brand. Price 0 = free.
     */
    function setPrice(uint256 tokenId, uint256 price) external {
        if (msg.sender != brand) revert TicketSaleOnlyBrand();
        _pricePerTicket[tokenId] = price;
        _priceSet[tokenId] = true;
        emit PriceSet(tokenId, price);
    }

    /**
     * @notice Buys tickets of type tokenId. Pays quantity * price; receives tickets from this contract.
     */
    function buy(uint256 tokenId, uint256 quantity) external nonReentrant {
        if (!_priceSet[tokenId]) revert TicketSalePriceNotSet();
        if (block.timestamp < startTime || block.timestamp > endTime) revert TicketSaleTimeWindow();
        if (quantity == 0) revert TicketSaleZeroQuantity();

        uint256 price = _pricePerTicket[tokenId];
        uint256 cost = price * quantity;

        // Checks-effects-interactions (audit H-1): verify ticket stock BEFORE taking payment.
        uint256 balance = eventTickets.balanceOf(address(this), tokenId);
        if (balance < quantity) revert TicketSaleInsufficientBalance();

        if (cost > 0) {
            if (address(paymentToken) == address(0)) revert TicketSaleOnlyUSDCOrFree();
            paymentToken.safeTransferFrom(msg.sender, address(this), cost);
            uint256 fee = (cost * feeBps) / 10000;
            uint256 toBrand = cost - fee;
            if (fee > 0) paymentToken.safeTransfer(feeRecipient, fee);
            if (toBrand > 0) paymentToken.safeTransfer(brand, toBrand);
        }

        eventTickets.safeTransferFrom(address(this), msg.sender, tokenId, quantity, "");

        emit Bought(msg.sender, tokenId, quantity, cost);
    }

    function getPrice(uint256 tokenId) external view returns (uint256, bool) {
        return (_pricePerTicket[tokenId], _priceSet[tokenId]);
    }
}
