// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/**
 * @title BaseStablecoins
 * @author Mana Chain
 * @notice USDC addresses on Base. Payments on Mana Chain are in USDC only (or free for tickets).
 * @dev Base Mainnet = 8453, Base Sepolia Testnet = 84532.
 */
library BaseStablecoins {
    /// @dev USDC on Base Mainnet
    address internal constant USDC_BASE_MAINNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @dev USDC on Base Sepolia Testnet
    address internal constant USDC_BASE_TESTNET = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    error BaseStablecoinsUnsupportedChain();

    /// @dev Base Mainnet chain ID
    uint256 internal constant CHAIN_ID_BASE_MAINNET = 43113;
    /// @dev Base Sepolia Testnet chain ID
    uint256 internal constant CHAIN_ID_BASE_SEPOLIA = 43113;

    /**
     * @notice Returns the USDC address for the current chain.
     * @return USDC contract address (reverts if chain is not Base mainnet or Base Sepolia).
     */
    function getUSDC() internal view returns (address) {
        if (block.chainid == CHAIN_ID_BASE_MAINNET) return USDC_BASE_MAINNET;
        if (block.chainid == CHAIN_ID_BASE_SEPOLIA) return USDC_BASE_TESTNET;
        revert BaseStablecoinsUnsupportedChain();
    }

    /**
     * @notice Returns true if the given address is the canonical USDC on this chain.
     */
    function isUSDC(address token) internal view returns (bool) {
        return token == getUSDC();
    }

    // ---------- Public getters for frontend / scripts ----------

    /**
     * @notice USDC on Base Mainnet (chainId 8453). For use in frontend or deploy scripts.
     */
    function getUSDCBaseMainnet() public pure returns (address) {
        return USDC_BASE_MAINNET;
    }

    /**
     * @notice USDC on Base Sepolia Testnet (chainId 84532). For use in frontend or deploy scripts.
     */
    function getUSDCBaseTestnet() public pure returns (address) {
        return USDC_BASE_TESTNET;
    }

    /**
     * @notice Returns the canonical USDC address for the current chain. Reverts if not Base.
     * @dev Call from frontend/scripts: use the deployed library address and call getUSDC().
     */
    function getUSDCForChain() public view returns (address) {
        return getUSDC();
    }
}
