// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @author Mana Chain
 * @notice Testnet-only stablecoin (6 decimals) used as the platform payment token on Fuji.
 *         Anyone can mint up to MAX_MINT_PER_CALL per call (public faucet for demos).
 * @dev Never deploy on mainnet: mint is permissionless by design.
 */
contract MockUSDC is ERC20 {
    /// @dev Faucet cap per mint call: 10,000 USDC (6 decimals).
    uint256 public constant MAX_MINT_PER_CALL = 10_000e6;

    error MockUSDCMintCapExceeded();

    constructor() ERC20("USD Coin (Mock)", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Public faucet mint, capped per call to keep demo balances reasonable.
     * @param to Recipient.
     * @param amount Amount in 6-decimal units (max MAX_MINT_PER_CALL).
     */
    function mint(address to, uint256 amount) external {
        if (amount > MAX_MINT_PER_CALL) revert MockUSDCMintCapExceeded();
        _mint(to, amount);
    }
}
