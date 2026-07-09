// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ITokenSaleEscrow} from "../interfaces/ITokenSaleEscrow.sol";

/**
 * @title TokenSaleEscrow
 * @author Mana Chain
 * @notice Primary sale of BrandSupportToken against the platform stablecoin. Holds funds in escrow; brand claims on success; on cancel, token holders can claim refunds.
 * @dev The payment token is injected at deployment. Platform-recognized escrows are deployed via SaleFactory, which pins the canonical stablecoin. Implements ITokenSaleEscrow so ManaAdmin can call cancelSaleByAdmin().
 */
contract TokenSaleEscrow is ERC165, ReentrancyGuard, ITokenSaleEscrow {
    using SafeERC20 for IERC20;

    /// @dev Base units of one whole support token (BrandSupportToken has 18 decimals).
    uint256 private constant SUPPORT_TOKEN_UNIT = 1e18;

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
    uint256 private _refundedAmount;
    bool private _brandClaimed;

    /// @dev Per-buyer accounting so refunds can only return what each buyer actually paid (audit C-1).
    mapping(address => uint256) private _boughtOf;
    mapping(address => uint256) private _paidOf;

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
    error TokenSaleEscrowRefundExceedsSold();
    error TokenSaleEscrowRefundExceedsPurchase();

    event Bought(address indexed buyer, uint256 amount, uint256 paid);
    event SaleClosed();
    event SaleCancelledByAdmin();
    event SaleCancelledByBrand();
    event BrandClaimed(address indexed brand, uint256 amount, uint256 fee);
    event RefundClaimed(address indexed user, uint256 tokenAmount, uint256 refundAmount);

    /**
     * @notice Deploys the escrow. Caller must transfer totalForSale support tokens to this contract before sale is effective.
     * @param supportToken_ ERC-20 support token sold.
     * @param paymentToken_ Platform stablecoin (6 decimals). Pinned by SaleFactory for platform-recognized sales.
     * @param brand_ Address that receives proceeds (minus fee) when sale is closed successfully.
     * @param manaAdmin_ ManaAdmin contract; only it can call cancelSaleByAdmin().
     * @param feeRecipient_ Address that receives platform fee.
     * @param pricePerToken_ Price in payment-token units (6 decimals) per one WHOLE support token (1e18 base units).
     * @param totalForSale_ Max support tokens to sell, in base units (18 decimals).
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
     * @notice Buy support tokens with payment token. Cost is scaled so pricePerToken applies per whole token (1e18 base units), rounded up so partial units are never free.
     * @param amount Support tokens to buy, in base units (18 decimals).
     */
    function buy(uint256 amount) external nonReentrant {
        if (_state != State.Open) revert TokenSaleEscrowNotOpen();
        if (block.timestamp < startTime || block.timestamp > endTime) revert TokenSaleEscrowTimeWindow();
        if (amount == 0) revert TokenSaleEscrowZeroAmount();
        if (_soldAmount + amount > totalForSale) revert TokenSaleEscrowInsufficientSupply();

        uint256 cost = Math.mulDiv(amount, pricePerToken, SUPPORT_TOKEN_UNIT, Math.Rounding.Ceil);
        _soldAmount += amount;
        _boughtOf[msg.sender] += amount;
        _paidOf[msg.sender] += cost;

        paymentToken.safeTransferFrom(msg.sender, address(this), cost);
        supportToken.safeTransfer(msg.sender, amount);

        emit Bought(msg.sender, amount, cost);
    }

    /**
     * @notice Mark sale as closed (success). Can be called by brand or anyone after endTime.
     */
    function endSale() external {
        if (_state != State.Open) revert TokenSaleEscrowNotOpen();
        if (msg.sender != brand) revert TokenSaleEscrowOnlyBrand();
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
     * @notice After cancellation, a buyer sends support tokens back and receives a pro-rata share of what THEY paid. Only original buyers can refund, capped at their own purchase (audit C-1: no third-party drain).
     * @param amount Support tokens to refund, in base units (user must approve this contract).
     */
    function claimRefund(uint256 amount) external nonReentrant {
        if (_state != State.Cancelled) revert TokenSaleEscrowNotCancelled();
        if (msg.sender == brand) revert TokenSaleEscrowOnlyBrand(); // Using this as error to prevent brand drain
        if (amount == 0) revert TokenSaleEscrowZeroAmount();
        uint256 bought = _boughtOf[msg.sender];
        if (amount > bought) revert TokenSaleEscrowRefundExceedsPurchase();
        if (_refundedAmount + amount > _soldAmount) revert TokenSaleEscrowRefundExceedsSold();

        // Pro-rata of the buyer's own payment: refunding everything returns exactly what they paid.
        uint256 refund = Math.mulDiv(_paidOf[msg.sender], amount, bought);
        _boughtOf[msg.sender] = bought - amount;
        _paidOf[msg.sender] -= refund;
        _refundedAmount += amount;

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

    /// @notice Support tokens still refundable by `buyer` (their purchases minus prior refunds).
    function getBoughtOf(address buyer) external view returns (uint256) {
        return _boughtOf[buyer];
    }

    /// @notice Payment still refundable to `buyer` (what they paid minus prior refunds).
    function getPaidOf(address buyer) external view returns (uint256) {
        return _paidOf[buyer];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(ITokenSaleEscrow).interfaceId || super.supportsInterface(interfaceId);
    }
}
