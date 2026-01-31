// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {BrandSupportToken} from "./BrandSupportToken.sol";

/**
 * @title FractionalVault
 * @author Mana Chain
 * @notice Holds the Brand Genesis NFT and controls minting/burning of the BrandSupportToken (ERC-20). Upgradeable via UUPS.
 */
contract FractionalVault is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    BrandSupportToken private _supportToken;
    IERC721 private _genesisNFT;
    uint256 private _genesisTokenId;
    address private _escrow; // Optional: can call burnVaultBalance after sending tokens to vault for refund flow

    uint256[47] private __gap;

    error FractionalVaultZeroAddress();
    error FractionalVaultTokenAlreadySet();
    error FractionalVaultTokenNotSet();
    error FractionalVaultNFTAlreadyDeposited();
    error FractionalVaultInsufficientBalance();
    error FractionalVaultUnauthorized();

    event SupportTokenSet(address indexed token);
    event GenesisDeposited(address indexed nft, uint256 indexed tokenId);
    event SupportMinted(address indexed to, uint256 amount);
    event SupportBurned(address indexed from, uint256 amount);
    event VaultBalanceBurned(uint256 amount);
    event EscrowSet(address indexed escrow);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the vault with the brand owner. Support token and Genesis NFT are set separately.
     * @param owner_ Brand owner (e.g. brand wallet or Factory).
     */
    function initialize(address owner_) external initializer {
        if (owner_ == address(0)) revert FractionalVaultZeroAddress();
        __Ownable_init(owner_);
    }

    /**
     * @notice Sets the support token address. Can only be called once.
     * @param token_ Address of the BrandSupportToken that uses this vault as its minter/burner.
     */
    function setSupportToken(BrandSupportToken token_) external onlyOwner {
        if (address(token_) == address(0)) revert FractionalVaultZeroAddress();
        if (address(_supportToken) != address(0)) revert FractionalVaultTokenAlreadySet();
        if (address(token_).code.length == 0) revert FractionalVaultZeroAddress();
        _supportToken = token_;
        emit SupportTokenSet(address(token_));
    }

    /**
     * @notice Sets the escrow address allowed to call burnVaultBalance (for refund flow: escrow sends tokens to vault, then burns).
     * @param escrow_ TokenSaleEscrow address (or zero to disable).
     */
    function setEscrow(address escrow_) external onlyOwner {
        _escrow = escrow_;
        emit EscrowSet(escrow_);
    }

    /**
     * @notice Deposits the Genesis NFT into this vault. Caller must own the NFT and have approved this contract.
     * @param nft_ Genesis NFT contract address.
     * @param tokenId_ Token ID to lock.
     */
    function depositGenesis(IERC721 nft_, uint256 tokenId_) external onlyOwner {
        if (address(nft_) == address(0)) revert FractionalVaultZeroAddress();
        if (address(_genesisNFT) != address(0)) revert FractionalVaultNFTAlreadyDeposited();
        _genesisNFT = nft_;
        _genesisTokenId = tokenId_;
        nft_.transferFrom(msg.sender, address(this), tokenId_);
        emit GenesisDeposited(address(nft_), tokenId_);
    }

    /**
     * @notice Mints support tokens to `to`. Only owner (brand).
     * @param to Recipient.
     * @param amount Amount to mint.
     */
    function mintSupport(address to, uint256 amount) external onlyOwner {
        if (address(_supportToken) == address(0)) revert FractionalVaultTokenNotSet();
        _supportToken.mint(to, amount);
        emit SupportMinted(to, amount);
    }

    /**
     * @notice Burns support tokens from `from`. Only owner. Use for buyback or other flows.
     * @param from Address whose tokens to burn (must have balance and no approval needed: vault is trusted).
     * @param amount Amount to burn.
     */
    function burnSupport(address from, uint256 amount) external onlyOwner {
        if (address(_supportToken) == address(0)) revert FractionalVaultTokenNotSet();
        _supportToken.burn(from, amount);
        emit SupportBurned(from, amount);
    }

    /**
     * @notice Burns support tokens held by this vault. Used after escrow sends tokens to vault on refund.
     * @param amount Amount to burn. Callable by owner or by the set escrow.
     */
    function burnVaultBalance(uint256 amount) external {
        if (msg.sender != owner() && msg.sender != _escrow) revert FractionalVaultUnauthorized();
        if (address(_supportToken) == address(0)) revert FractionalVaultTokenNotSet();
        if (_supportToken.balanceOf(address(this)) < amount) revert FractionalVaultInsufficientBalance();
        _supportToken.burn(address(this), amount);
        emit VaultBalanceBurned(amount);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function getSupportToken() external view returns (address) {
        return address(_supportToken);
    }

    function getGenesisNFT() external view returns (address, uint256) {
        return (address(_genesisNFT), _genesisTokenId);
    }

    function getEscrow() external view returns (address) {
        return _escrow;
    }
}
