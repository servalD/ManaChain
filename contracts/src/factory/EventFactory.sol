// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {EventTickets} from "../events/EventTickets.sol";

/**
 * @title IManaAdmin
 * @notice Minimal interface for ManaAdmin used by EventFactory (whitelist check).
 */
interface IManaAdmin {
    function isBrandAllowed(address brand) external view returns (bool);
}

/**
 * @title EventFactory
 * @author Mana Chain
 * @notice Deploys EventTickets (ERC-1155) for whitelisted brands only. Only the brand can deploy its event.
 */
contract EventFactory {
    IManaAdmin public immutable manaAdmin;
    address public immutable eventTicketsImplementation;

    event EventModuleDeployed(address indexed brand, address indexed eventTickets);

    error EventFactoryBrandNotAllowed();
    error EventFactoryOnlyBrand();
    error EventFactoryZeroAddress();

    constructor(IManaAdmin manaAdmin_, address eventTicketsImpl_) {
        if (address(manaAdmin_) == address(0) || eventTicketsImpl_ == address(0)) revert EventFactoryZeroAddress();
        manaAdmin = manaAdmin_;
        eventTicketsImplementation = eventTicketsImpl_;
    }

    /**
     * @notice Deploys an EventTickets contract for a whitelisted brand.
     * @param brand Address of the brand (must equal msg.sender).
     * @param uri_ Base URI for ticket metadata (e.g. https://api.example.com/event/{id}.json).
     * @return eventTickets Proxy address of the EventTickets contract (brand has MINTER_ROLE and DEFAULT_ADMIN_ROLE).
     */
    function deployEventModule(
        address brand,
        string calldata uri_
    ) external returns (address eventTickets) {
        if (msg.sender != brand) revert EventFactoryOnlyBrand();
        if (!manaAdmin.isBrandAllowed(brand)) revert EventFactoryBrandNotAllowed();

        bytes memory data = abi.encodeCall(EventTickets.initialize, (uri_, brand));
        ERC1967Proxy proxy = new ERC1967Proxy(eventTicketsImplementation, data);
        eventTickets = address(proxy);

        emit EventModuleDeployed(brand, eventTickets);
    }
}
