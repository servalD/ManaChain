// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

/// @dev Minimal interface shared by BrandFactory and EventFactory.
///      Defined here to avoid Solidity scoping issues with file-level interfaces.
interface IManaAdminLike {
    function isBrandAllowed(address brand) external view returns (bool);
}
