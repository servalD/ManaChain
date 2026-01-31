// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC1155Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import {ERC1155SupplyUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import {ManaRoles} from "../constants/ManaRoles.sol";

/**
 * @title EventTickets
 * @author Mana Chain
 * @notice ERC-1155 tickets for an event. Each tokenId is a ticket type (e.g. VIP, standard). Mint only by MINTER_ROLE (brand or EventFactory).
 */
contract EventTickets is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ERC1155Upgradeable,
    ERC1155SupplyUpgradeable
{

    /// @dev Optional: image URL for the event (e.g. poster).
    string private _imageURI;

    uint256[49] private __gap;

    error EventTicketsZeroAddress();

    event TicketsMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event ImageURISet(string imageURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the event tickets contract.
     * @param uri_ Base URI for token metadata (e.g. https://api.example.com/event/{id}.json).
     * @param admin Address that receives DEFAULT_ADMIN_ROLE and MINTER_ROLE (e.g. brand or EventFactory).
     */
    function initialize(string calldata uri_, address admin) external initializer {
        if (admin == address(0)) revert EventTicketsZeroAddress();
        __AccessControl_init();
        __ERC1155_init(uri_);
        __ERC1155Supply_init();
        _grantRole(ManaRoles.getDefaultAdminRole(), admin);
        _grantRole(ManaRoles.getMinterRole(), admin);
    }

    /// @notice Returns the MINTER_ROLE id (for use with hasRole, etc.). See ManaRoles.
    function MINTER_ROLE() external pure returns (bytes32) {
        return ManaRoles.getMinterRole();
    }

    /**
     * @notice Mints tickets of type tokenId to to. Only MINTER_ROLE.
     * @param to Recipient.
     * @param tokenId Ticket type ID.
     * @param amount Number of tickets.
     */
    function mint(address to, uint256 tokenId, uint256 amount) external onlyRole(ManaRoles.getMinterRole()) {
        _mint(to, tokenId, amount, "");
        emit TicketsMinted(to, tokenId, amount);
    }

    /**
     * @notice Mints a batch of ticket types to to. Only MINTER_ROLE.
     */
    function mintBatch(
        address to,
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external onlyRole(ManaRoles.getMinterRole()) {
        _mintBatch(to, tokenIds, amounts, "");
        for (uint256 i; i < tokenIds.length; i++) {
            emit TicketsMinted(to, tokenIds[i], amounts[i]);
        }
    }

    /**
     * @notice Sets the event image URL (poster). Only DEFAULT_ADMIN_ROLE.
     */
    function setImageURI(string calldata imageURI_) external onlyRole(ManaRoles.getDefaultAdminRole()) {
        _imageURI = imageURI_;
        emit ImageURISet(imageURI_);
    }

    function imageURI() external view returns (string memory) {
        return _imageURI;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ManaRoles.getDefaultAdminRole()) {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155Upgradeable, ERC1155SupplyUpgradeable) {
        super._update(from, to, ids, values);
    }
}
