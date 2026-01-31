// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";

/**
 * @title BrandGenesisNFT
 * @author Mana Chain
 * @notice ERC-721 representing brand identity. Minted by Factory or ManaAdmin (MINTER_ROLE). Upgradeable via UUPS.
 */
contract BrandGenesisNFT is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Image URL per token (direct link to the NFT image).
    mapping(uint256 => string) private _tokenImageURI;

    /// @dev Reserve storage for future upgrades.
    uint256[49] private __gap;

    error BrandGenesisNFTZeroAddress();

    event GenesisMinted(address indexed to, uint256 indexed tokenId, string tokenURI, string imageURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the Brand Genesis NFT contract.
     * @param name_ Token collection name.
     * @param symbol_ Token collection symbol.
     * @param admin Address that receives DEFAULT_ADMIN_ROLE and MINTER_ROLE (e.g. Factory or ManaAdmin).
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        address admin
    ) external initializer {
        if (admin == address(0)) revert BrandGenesisNFTZeroAddress();
        __AccessControl_init();
        __ERC721_init(name_, symbol_);
        __ERC721URIStorage_init();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    /**
     * @notice Mints a new Genesis NFT to `to` with optional metadata URI and image link.
     * @dev Only accounts with MINTER_ROLE (Factory or ManaAdmin) can call.
     * @param to Recipient of the NFT.
     * @param tokenId Token ID (caller must ensure uniqueness, e.g. sequential or derived from brand id).
     * @param uri Optional token metadata URI (can be empty string).
     * @param imageUri Optional direct link to the NFT image (can be empty string).
     */
    function mint(address to, uint256 tokenId, string calldata uri, string calldata imageUri) external onlyRole(MINTER_ROLE) {
        _mint(to, tokenId);
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }
        if (bytes(imageUri).length > 0) {
            _tokenImageURI[tokenId] = imageUri;
        }
        emit GenesisMinted(to, tokenId, uri, imageUri);
    }

    /**
     * @notice Safe mint: mints and checks receiver implements IERC721Receiver if it is a contract.
     * @param to Recipient.
     * @param tokenId Token ID.
     * @param uri Optional token URI.
     * @param imageUri Optional direct link to the NFT image.
     */
    function safeMint(address to, uint256 tokenId, string calldata uri, string calldata imageUri) external onlyRole(MINTER_ROLE) {
        _safeMint(to, tokenId);
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }
        if (bytes(imageUri).length > 0) {
            _tokenImageURI[tokenId] = imageUri;
        }
        emit GenesisMinted(to, tokenId, uri, imageUri);
    }

    /**
     * @notice Returns the direct image URL for a token, if set.
     * @param tokenId Token ID.
     * @return The image URI (empty string if not set).
     */
    function tokenImageURI(uint256 tokenId) external view returns (string memory) {
        return _tokenImageURI[tokenId];
    }

    /**
     * @notice Sets or updates the image URI for a token. Only MINTER_ROLE.
     * @param tokenId Token ID.
     * @param imageUri Direct link to the image.
     */
    function setTokenImageURI(uint256 tokenId, string calldata imageUri) external onlyRole(MINTER_ROLE) {
        _tokenImageURI[tokenId] = imageUri;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    function _baseURI() internal pure override returns (string memory) {
        return "";
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return ERC721URIStorageUpgradeable.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
