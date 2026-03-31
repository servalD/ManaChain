// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {BrandGenesisNFT} from "../brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../brand/FractionalVault.sol";
import {BrandSupportToken} from "../brand/BrandSupportToken.sol";

/**
 * @title IManaAdmin
 * @notice Minimal interface for ManaAdmin used by BrandFactory (whitelist check).
 */
interface IManaAdmin {
    function isBrandAllowed(address brand) external view returns (bool);
}

/**
 * @title BrandFactory
 * @author Mana Chain
 * @notice Deploys the fractionalizable NFT module (Genesis NFT + Vault + Support Token) for whitelisted brands only.
 * @dev Uses ManaAdmin.isBrandAllowed(brand); only the brand address can deploy its own module. One module per brand.
 */
contract BrandFactory {
    IManaAdmin public immutable manaAdmin;
    address public immutable genesisNFTImplementation;
    address public immutable vaultImplementation;
    address public immutable tokenImplementation;

    /// @dev brand => true if deployBrandModule was already called for this brand.
    mapping(address => bool) private _hasDeployed;

    event BrandModuleDeployed(
        address indexed brand,
        address indexed genesisNFT,
        address indexed vault,
        address supportToken
    );

    error BrandFactoryBrandNotAllowed();
    error BrandFactoryOnlyBrand();
    error BrandFactoryZeroAddress();
    error BrandFactoryAlreadyDeployed();

    /**
     * @notice Sets ManaAdmin and implementation addresses. Implementations must be deployed and initialized (disabled) beforehand.
     * @param manaAdmin_ ManaAdmin contract for whitelist check.
     * @param genesisNFTImpl_ BrandGenesisNFT implementation (no proxy).
     * @param vaultImpl_ FractionalVault implementation (no proxy).
     * @param tokenImpl_ BrandSupportToken implementation (no proxy).
     */
    constructor(
        IManaAdmin manaAdmin_,
        address genesisNFTImpl_,
        address vaultImpl_,
        address tokenImpl_
    ) {
        if (
            address(manaAdmin_) == address(0) || genesisNFTImpl_ == address(0)
                || vaultImpl_ == address(0) || tokenImpl_ == address(0)
        ) revert BrandFactoryZeroAddress();

        manaAdmin = manaAdmin_;
        genesisNFTImplementation = genesisNFTImpl_;
        vaultImplementation = vaultImpl_;
        tokenImplementation = tokenImpl_;
    }

    /**
     * @notice Deploys the full brand module (Genesis NFT, Vault, Support Token) for a whitelisted brand. One per brand.
     * @dev Only callable by the brand; ManaAdmin must have the brand whitelisted. Reverts if this brand already deployed.
     * @param brand Address of the brand (must equal msg.sender).
     * @param nftName Genesis NFT collection name.
     * @param nftSymbol Genesis NFT collection symbol.
     * @param tokenName Support token name.
     * @param tokenSymbol Support token symbol.
     * @param tokenImageURI Optional logo URL for the support token (can be "").
     * @param totalSupplyCap Maximum total supply of the support token (0 = unlimited). Vault cannot mint beyond this.
     * @return genesisNFT Proxy address of the Genesis NFT.
     * @return vault Proxy address of the FractionalVault.
     * @return supportToken Proxy address of the BrandSupportToken.
     */
    function deployBrandModule(
        address brand,
        string calldata nftName,
        string calldata nftSymbol,
        string calldata tokenName,
        string calldata tokenSymbol,
        string calldata tokenImageURI,
        uint256 totalSupplyCap
    ) external returns (address genesisNFT, address vault, address supportToken) {
        if (msg.sender != brand) revert BrandFactoryOnlyBrand();
        if (!manaAdmin.isBrandAllowed(brand)) revert BrandFactoryBrandNotAllowed();
        if (_hasDeployed[brand]) revert BrandFactoryAlreadyDeployed();
        _hasDeployed[brand] = true;

        // 1) Deploy Genesis NFT proxy (brand is admin + minter)
        bytes memory genesisData = abi.encodeCall(BrandGenesisNFT.initialize, (nftName, nftSymbol, brand));
        ERC1967Proxy genesisProxy = new ERC1967Proxy(genesisNFTImplementation, genesisData);
        genesisNFT = address(genesisProxy);

        // 2) Deploy Vault proxy (factory is owner temporarily)
        bytes memory vaultData = abi.encodeCall(FractionalVault.initialize, (address(this)));
        ERC1967Proxy vaultProxy = new ERC1967Proxy(vaultImplementation, vaultData);
        vault = address(vaultProxy);

        // 3) Deploy Support Token proxy (vault is the only minter/burner, cap = totalSupplyCap)
        bytes memory tokenData = abi.encodeCall(BrandSupportToken.initialize, (tokenName, tokenSymbol, vault, tokenImageURI, totalSupplyCap));
        ERC1967Proxy tokenProxy = new ERC1967Proxy(tokenImplementation, tokenData);
        supportToken = address(tokenProxy);

        // 4) Link token to vault
        FractionalVault(vault).setSupportToken(BrandSupportToken(supportToken));

        // 5) Transfer vault ownership to brand
        FractionalVault(vault).transferOwnership(brand);

        emit BrandModuleDeployed(brand, genesisNFT, vault, supportToken);
    }

    /// @notice Returns true if the brand has already deployed its module (one per brand).
    function hasDeployed(address brand) external view returns (bool) {
        return _hasDeployed[brand];
    }
}
