// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ITokenSaleEscrow} from "../interfaces/ITokenSaleEscrow.sol";

/**
 * @title TokenSaleEscrow
 * @author Mana Chain
 * @notice Primary sale of BrandSupportToken for USDC/USDT. Holds funds in escrow; brand claims on success; on cancel, token holders can claim refunds.
 * @dev Implements ITokenSaleEscrow so ManaAdmin can call cancelSaleByAdmin() to enable refunds.
 */
contract TokenSaleEscrow is ReentrancyGuard, ITokenSaleEscrow {
    using SafeERC20 for IERC20;

    enum State {
        Open,
        Closed,
        Cancelled
    }

    IERC20 public immutable supportToken;
    IERC20 public immutable paymentToken;
    address public immutable brand;
    address public immutable manaAdmin;
    address public immutable feeRecipient;
    uint256 public immutable pricePerToken;
    uint256 public immutable totalForSale;
    uint256 public immutable startTime;
    uint256 public immutable endTime;
    uint16 public immutable feeBps;

    State private _state;
    uint256 private _soldAmount;
    bool private _brandClaimed;

    error TokenSaleEscrowInvalidConfig();
    error TokenSaleEscrowAlreadyClaimed();
    error TokenSaleEscrowNotOpen();
    error TokenSaleEscrowNotClosed();
    error TokenSaleEscrowNotCancelled();
    error TokenSaleEscrowOnlyBrand();
    error TokenSaleEscrowOnlyManaAdmin();
    error TokenSaleEscrowInsufficientSupply();
    error TokenSaleEscrowTimeWindow();
    error TokenSaleEscrowZeroAmount();

    event Bought(address indexed buyer, uint256 amount, uint256 paid);
    event SaleClosed();
    event SaleCancelledByAdmin();
    event SaleCancelledByBrand();
    event BrandClaimed(address indexed brand, uint256 amount, uint256 fee);
    event RefundClaimed(address indexed user, uint256 tokenAmount, uint256 refundAmount);

    /**
     * @notice Deploys the escrow. Caller must transfer totalForSale support tokens to this contract before sale is effective.
     * @param supportToken_ ERC-20 support token sold.
     * @param paymentToken_ ERC-20 used for payment (e.g. USDC, USDT).
     * @param brand_ Address that receives proceeds (minus fee) when sale is closed successfully.
     * @param manaAdmin_ ManaAdmin contract; only it can call cancelSaleByAdmin().
     * @param feeRecipient_ Address that receives platform fee.
     * @param pricePerToken_ Price in payment-token units per one support token (same decimals as payment token).
     * @param totalForSale_ Max support tokens to sell.
     * @param startTime_ Sale start timestamp.
     * @param endTime_ Sale end timestamp.
     * @param feeBps_ Fee in basis points (e.g. 500 = 5%). Max 10000.
     */
    constructor(
        IERC20 supportToken_,
        IERC20 paymentToken_,
        address brand_,
        address manaAdmin_,
        address feeRecipient_,
        uint256 pricePerToken_,
        uint256 totalForSale_,
        uint256 startTime_,
        uint256 endTime_,
        uint16 feeBps_
    ) {
        if (
            address(supportToken_) == address(0) || address(paymentToken_) == address(0)
                || brand_ == address(0) || manaAdmin_ == address(0) || feeRecipient_ == address(0)
        ) revert TokenSaleEscrowInvalidConfig();
        if (endTime_ <= startTime_ || totalForSale_ == 0 || feeBps_ > 10000) revert TokenSaleEscrowInvalidConfig();

        supportToken = supportToken_;
        paymentToken = paymentToken_;
        brand = brand_;
        manaAdmin = manaAdmin_;
        feeRecipient = feeRecipient_;
        pricePerToken = pricePerToken_;
        totalForSale = totalForSale_;
        startTime = startTime_;
        endTime = endTime_;
        feeBps = feeBps_;
        _state = State.Open;
    }

    /**
     * @notice Buy support tokens with payment token. Caller pays amount * pricePerToken and receives amount support tokens.
     * @param amount Number of support tokens to buy.
     */
    function buy(uint256 amount) external nonReentrant {
        if (_state != State.Open) revert TokenSaleEscrowNotOpen();
        if (block.timestamp < startTime || block.timestamp > endTime) revert TokenSaleEscrowTimeWindow();
        if (amount == 0) revert TokenSaleEscrowZeroAmount();
        if (_soldAmount + amount > totalForSale) revert TokenSaleEscrowInsufficientSupply();

        uint256 cost = amount * pricePerToken;
        _soldAmount += amount;

        paymentToken.safeTransferFrom(msg.sender, address(this), cost);
        supportToken.safeTransfer(msg.sender, amount);

        emit Bought(msg.sender, amount, cost);
    }

    /**
     * @notice Mark sale as closed (success). Can be called by brand or anyone after endTime.
     */
    function endSale() external {
        if (_state != State.Open) revert TokenSaleEscrowNotOpen();
        if (msg.sender != brand && block.timestamp <= endTime) revert TokenSaleEscrowTimeWindow();
        _state = State.Closed;
        emit SaleClosed();
    }

    /**
     * @notice Brand claims proceeds (minus fee) after sale is closed.
     */
    function claimByBrand() external nonReentrant {
        if (_state != State.Closed) revert TokenSaleEscrowNotClosed();
        if (msg.sender != brand) revert TokenSaleEscrowOnlyBrand();
        if (_brandClaimed) revert TokenSaleEscrowAlreadyClaimed();

        uint256 balance = paymentToken.balanceOf(address(this));
        uint256 fee = (balance * feeBps) / 10000;
        uint256 toBrand = balance - fee;

        _brandClaimed = true;
        if (fee > 0) paymentToken.safeTransfer(feeRecipient, fee);
        if (toBrand > 0) paymentToken.safeTransfer(brand, toBrand);

        emit BrandClaimed(brand, toBrand, fee);
    }

    /**
     * @notice Cancels the sale and enables refunds. Only callable by ManaAdmin (ITokenSaleEscrow).
     */
    function cancelSaleByAdmin() external override {
        if (msg.sender != manaAdmin) revert TokenSaleEscrowOnlyManaAdmin();
        if (_state != State.Open) revert TokenSaleEscrowNotOpen();
        _state = State.Cancelled;
        emit SaleCancelledByAdmin();
    }

    /**
     * @notice Brand can cancel the sale to enable refunds.
     */
    function cancelByBrand() external {
        if (msg.sender != brand) revert TokenSaleEscrowOnlyBrand();
        if (_state != State.Open) revert TokenSaleEscrowNotOpen();
        _state = State.Cancelled;
        emit SaleCancelledByBrand();
    }

    /**
     * @notice After cancellation, user sends support tokens back and receives payment token refund.
     * @param amount Number of support tokens to refund (user must approve this contract).
     */
    function claimRefund(uint256 amount) external nonReentrant {
        if (_state != State.Cancelled) revert TokenSaleEscrowNotCancelled();
        if (amount == 0) revert TokenSaleEscrowZeroAmount();

        uint256 refund = amount * pricePerToken;
        supportToken.safeTransferFrom(msg.sender, address(this), amount);
        paymentToken.safeTransfer(msg.sender, refund);

        emit RefundClaimed(msg.sender, amount, refund);
    }

    function getState() external view returns (State) {
        return _state;
    }

    function getSoldAmount() external view returns (uint256) {
        return _soldAmount;
    }
}
