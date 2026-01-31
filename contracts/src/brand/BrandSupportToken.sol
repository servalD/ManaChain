// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {ERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

/**
 * @title BrandSupportToken
 * @author Mana Chain
 * @notice ERC-20 fractional units linked to a Brand Genesis NFT. Mint and burn only by the FractionalVault.
 */
contract BrandSupportToken is Initializable, ERC20Upgradeable {
    /// @dev Only this address (the FractionalVault) can mint and burn.
    address private _vault;

    /// @dev Logo / image URL for the token (e.g. for wallets and UIs).
    string private _imageURI;

    /// @dev Maximum total supply (0 = unlimited).
    uint256 private _cap;

    /// @dev Reserve storage for future upgrades.
    uint256[48] private __gap;

    error BrandSupportTokenOnlyVault();
    error BrandSupportTokenZeroAddress();
    error BrandSupportTokenVaultAlreadySet();
    error BrandSupportTokenCapExceeded();

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the support token. Vault must be set and cannot be changed.
     * @param name_ Token name.
     * @param symbol_ Token symbol.
     * @param vault_ Address of the FractionalVault that can mint and burn.
     * @param imageURI_ Optional logo / image URL (can be empty string).
     * @param cap_ Maximum total supply (0 = unlimited). Vault cannot mint beyond this.
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        address vault_,
        string calldata imageURI_,
        uint256 cap_
    ) external initializer {
        if (vault_ == address(0)) revert BrandSupportTokenZeroAddress();
        __ERC20_init(name_, symbol_);
        _vault = vault_;
        _imageURI = imageURI_;
        _cap = cap_;
    }

    modifier onlyVault() {
        if (msg.sender != _vault) revert BrandSupportTokenOnlyVault();
        _;
    }

    /**
     * @notice Mints support tokens to `to`. Only callable by the vault. Reverts if cap would be exceeded.
     * @param to Recipient.
     * @param amount Amount to mint.
     */
    function mint(address to, uint256 amount) external onlyVault {
        if (_cap != 0 && totalSupply() + amount > _cap) revert BrandSupportTokenCapExceeded();
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @notice Burns support tokens from `from`. Only callable by the vault (e.g. on refund or buyback).
     * @param from Account to burn from (must have approved vault or vault pulls).
     * @param amount Amount to burn.
     */
    function burn(address from, uint256 amount) external onlyVault {
        _burn(from, amount);
        emit Burn(from, amount);
    }

    /**
     * @notice Returns the vault address that can mint and burn.
     */
    function vault() external view returns (address) {
        return _vault;
    }

    /**
     * @notice Returns the logo / image URL for the token (e.g. for wallets and UIs).
     */
    function imageURI() external view returns (string memory) {
        return _imageURI;
    }

    /**
     * @notice Updates the token logo / image URL. Only callable by the vault.
     * @param imageURI_ New image URL.
     */
    function setImageURI(string calldata imageURI_) external onlyVault {
        _imageURI = imageURI_;
    }

    /**
     * @notice Returns the maximum total supply (0 = unlimited).
     */
    function cap() external view returns (uint256) {
        return _cap;
    }
}
