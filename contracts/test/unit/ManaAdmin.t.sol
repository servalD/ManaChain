// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ManaAdmin} from "../../src/access/ManaAdmin.sol";
import {ManaRoles} from "../../src/constants/ManaRoles.sol";

contract ManaAdminTest is Test {
    ManaAdmin public admin;

    address public adminOwner = makeAddr("adminOwner");
    address public operator = makeAddr("operator");
    address public brand = makeAddr("brand");
    address public alice = makeAddr("alice");

    function setUp() public {
        ManaAdmin impl = new ManaAdmin();
        bytes memory data = abi.encodeCall(ManaAdmin.initialize, (adminOwner));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        admin = ManaAdmin(address(proxy));

        // Grant OPERATOR_ROLE to operator
        vm.prank(adminOwner);
        admin.grantRole(ManaRoles.getOperatorRole(), operator);
    }

    // ─── initialize ───────────────────────────────────────────────

    function test_initialize_setsRoles() public view {
        assertTrue(admin.hasRole(ManaRoles.getDefaultAdminRole(), adminOwner));
        assertTrue(admin.hasRole(ManaRoles.getOperatorRole(), adminOwner));
    }

    function test_initialize_revertZeroAddress() public {
        ManaAdmin impl = new ManaAdmin();
        bytes memory data = abi.encodeCall(ManaAdmin.initialize, (address(0)));
        vm.expectRevert(ManaAdmin.ManaAdminZeroAddress.selector);
        new ERC1967Proxy(address(impl), data);
    }

    // ─── Whitelist / Blacklist ─────────────────────────────────────

    function test_setBrandWhitelisted_onlyOperator() public {
        vm.prank(alice);
        vm.expectRevert();
        admin.setBrandWhitelisted(brand, true);
    }

    function test_setBrandWhitelisted_and_isBrandWhitelisted() public {
        vm.prank(operator);
        admin.setBrandWhitelisted(brand, true);
        assertTrue(admin.isBrandWhitelisted(brand));
    }

    function test_setBrandBlacklisted_and_isBrandBlacklisted() public {
        vm.startPrank(operator);
        admin.setBrandWhitelisted(brand, true);
        admin.setBrandBlacklisted(brand, true);
        vm.stopPrank();

        assertTrue(admin.isBrandWhitelisted(brand));
        assertTrue(admin.isBrandBlacklisted(brand));
        assertFalse(admin.isBrandAllowed(brand)); // whitelisted but blacklisted → not allowed
    }

    function test_isBrandAllowed_onlyWhenWhitelistedAndNotBlacklisted() public {
        assertFalse(admin.isBrandAllowed(brand));

        vm.prank(operator);
        admin.setBrandWhitelisted(brand, true);
        assertTrue(admin.isBrandAllowed(brand));

        vm.prank(operator);
        admin.setBrandBlacklisted(brand, true);
        assertFalse(admin.isBrandAllowed(brand));
    }

    function test_setBrandWhitelisted_emitsEvent() public {
        vm.prank(operator);
        vm.expectEmit(true, false, false, true);
        emit ManaAdmin.BrandWhitelisted(brand, true);
        admin.setBrandWhitelisted(brand, true);
    }

    // ─── Fees ─────────────────────────────────────────────────────

    function test_setFeePrimary_storesValue() public {
        vm.prank(operator);
        admin.setFeePrimary(500);
        assertEq(admin.getFeePrimary(), 500);
    }

    function test_setFeeSecondary_storesValue() public {
        vm.prank(operator);
        admin.setFeeSecondary(250);
        assertEq(admin.getFeeSecondary(), 250);
    }

    function test_setFeePrimary_revertExceedsMax() public {
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(ManaAdmin.ManaAdminFeeExceedsMax.selector, 10001));
        admin.setFeePrimary(10001);
    }

    function test_setFeeSecondary_revertExceedsMax() public {
        vm.prank(operator);
        vm.expectRevert(abi.encodeWithSelector(ManaAdmin.ManaAdminFeeExceedsMax.selector, 10001));
        admin.setFeeSecondary(10001);
    }

    function test_setFeeRecipient_storesValue() public {
        vm.prank(operator);
        admin.setFeeRecipient(alice);
        assertEq(admin.getFeeRecipient(), alice);
    }

    function test_setFeeRecipient_revertZeroAddress() public {
        vm.prank(operator);
        vm.expectRevert(ManaAdmin.ManaAdminZeroAddress.selector);
        admin.setFeeRecipient(address(0));
    }

    function test_setFeePrimary_onlyOperator() public {
        vm.prank(alice);
        vm.expectRevert();
        admin.setFeePrimary(100);
    }

    // ─── UUPS Upgrade ─────────────────────────────────────────────

    function test_upgrade_onlyDefaultAdmin() public {
        ManaAdmin newImpl = new ManaAdmin();

        vm.prank(alice);
        vm.expectRevert();
        admin.upgradeToAndCall(address(newImpl), "");

        // Admin can upgrade
        vm.prank(adminOwner);
        admin.upgradeToAndCall(address(newImpl), "");
    }
}
