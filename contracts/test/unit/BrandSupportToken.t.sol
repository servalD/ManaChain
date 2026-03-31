// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {BrandSupportToken} from "../../src/brand/BrandSupportToken.sol";

contract BrandSupportTokenTest is Test {
    BrandSupportToken public token;

    address public vault = makeAddr("vault");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant CAP = 1_000_000e18;

    function setUp() public {
        BrandSupportToken impl = new BrandSupportToken();
        bytes memory data = abi.encodeCall(
            BrandSupportToken.initialize,
            ("Brand Support", "BST", vault, "https://logo.png", CAP)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        token = BrandSupportToken(address(proxy));
    }

    // ─── initialize ───────────────────────────────────────────────

    function test_initialize_setsVault() public view {
        assertEq(token.vault(), vault);
    }

    function test_initialize_setsCap() public view {
        assertEq(token.cap(), CAP);
    }

    function test_initialize_setsImageURI() public view {
        assertEq(token.imageURI(), "https://logo.png");
    }

    function test_initialize_revertZeroVault() public {
        BrandSupportToken impl = new BrandSupportToken();
        bytes memory data = abi.encodeCall(
            BrandSupportToken.initialize,
            ("Brand Support", "BST", address(0), "", 0)
        );
        vm.expectRevert(BrandSupportToken.BrandSupportTokenZeroAddress.selector);
        new ERC1967Proxy(address(impl), data);
    }

    function test_initialize_doubleInit_reverts() public {
        vm.expectRevert();
        token.initialize("X", "X", vault, "", 0);
    }

    // ─── mint ─────────────────────────────────────────────────────

    function test_mint_onlyVault() public {
        vm.prank(alice);
        vm.expectRevert(BrandSupportToken.BrandSupportTokenOnlyVault.selector);
        token.mint(alice, 100e18);
    }

    function test_mint_increasesBalance() public {
        vm.prank(vault);
        token.mint(alice, 100e18);
        assertEq(token.balanceOf(alice), 100e18);
    }

    function test_mint_emitsEvent() public {
        vm.prank(vault);
        vm.expectEmit(true, false, false, true);
        emit BrandSupportToken.Mint(alice, 100e18);
        token.mint(alice, 100e18);
    }

    function test_mint_revertCapExceeded() public {
        vm.prank(vault);
        token.mint(alice, CAP);

        vm.prank(vault);
        vm.expectRevert(BrandSupportToken.BrandSupportTokenCapExceeded.selector);
        token.mint(alice, 1);
    }

    function test_mint_unlimitedCap() public {
        // cap = 0 means unlimited
        BrandSupportToken impl = new BrandSupportToken();
        bytes memory data = abi.encodeCall(
            BrandSupportToken.initialize,
            ("No Cap Token", "NCT", vault, "", 0)
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        BrandSupportToken unlimitedToken = BrandSupportToken(address(proxy));

        vm.prank(vault);
        unlimitedToken.mint(alice, type(uint256).max / 2); // No revert
        vm.prank(vault);
        unlimitedToken.mint(alice, 1); // Still no revert
    }

    // ─── burn ─────────────────────────────────────────────────────

    function test_burn_onlyVault() public {
        vm.prank(vault);
        token.mint(alice, 100e18);

        vm.prank(alice);
        vm.expectRevert(BrandSupportToken.BrandSupportTokenOnlyVault.selector);
        token.burn(alice, 50e18);
    }

    function test_burn_decreasesBalance() public {
        vm.prank(vault);
        token.mint(alice, 100e18);

        vm.prank(vault);
        token.burn(alice, 40e18);
        assertEq(token.balanceOf(alice), 60e18);
    }

    function test_burn_emitsEvent() public {
        vm.prank(vault);
        token.mint(alice, 100e18);

        vm.prank(vault);
        vm.expectEmit(true, false, false, true);
        emit BrandSupportToken.Burn(alice, 50e18);
        token.burn(alice, 50e18);
    }

    // ─── setImageURI ──────────────────────────────────────────────

    function test_setImageURI_onlyVault() public {
        vm.prank(alice);
        vm.expectRevert(BrandSupportToken.BrandSupportTokenOnlyVault.selector);
        token.setImageURI("https://new.png");
    }

    function test_setImageURI_updatesValue() public {
        vm.prank(vault);
        token.setImageURI("https://new.png");
        assertEq(token.imageURI(), "https://new.png");
    }
}
