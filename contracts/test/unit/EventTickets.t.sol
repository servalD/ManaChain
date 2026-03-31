// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {EventTickets} from "../../src/events/EventTickets.sol";
import {ManaRoles} from "../../src/constants/ManaRoles.sol";

contract EventTicketsTest is Test {
    EventTickets public tickets;

    address public admin = makeAddr("admin");
    address public minter = makeAddr("minter");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        EventTickets impl = new EventTickets();
        bytes memory data = abi.encodeCall(EventTickets.initialize, ("https://api.example.com/{id}.json", admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        tickets = EventTickets(address(proxy));

        vm.prank(admin);
        tickets.grantRole(ManaRoles.getMinterRole(), minter);
    }

    // ─── initialize ───────────────────────────────────────────────

    function test_initialize_setsRoles() public view {
        assertTrue(tickets.hasRole(ManaRoles.getDefaultAdminRole(), admin));
        assertTrue(tickets.hasRole(ManaRoles.getMinterRole(), admin));
    }

    function test_initialize_revertZeroAddress() public {
        EventTickets impl = new EventTickets();
        bytes memory data = abi.encodeCall(EventTickets.initialize, ("uri", address(0)));
        vm.expectRevert(EventTickets.EventTicketsZeroAddress.selector);
        new ERC1967Proxy(address(impl), data);
    }

    // ─── mint ─────────────────────────────────────────────────────

    function test_mint_onlyMinterRole() public {
        vm.prank(alice);
        vm.expectRevert();
        tickets.mint(alice, 1, 10);
    }

    function test_mint_increasesBalance() public {
        vm.prank(minter);
        tickets.mint(alice, 1, 50);
        assertEq(tickets.balanceOf(alice, 1), 50);
    }

    function test_mint_emitsEvent() public {
        vm.prank(minter);
        vm.expectEmit(true, true, false, true);
        emit EventTickets.TicketsMinted(alice, 1, 50);
        tickets.mint(alice, 1, 50);
    }

    function test_mint_multipleTokenIds() public {
        vm.startPrank(minter);
        tickets.mint(alice, 1, 10); // VIP
        tickets.mint(alice, 2, 20); // Standard
        vm.stopPrank();

        assertEq(tickets.balanceOf(alice, 1), 10);
        assertEq(tickets.balanceOf(alice, 2), 20);
    }

    // ─── mintBatch ────────────────────────────────────────────────

    function test_mintBatch_onlyMinterRole() public {
        uint256[] memory ids = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);
        ids[0] = 1; ids[1] = 2;
        amounts[0] = 10; amounts[1] = 20;

        vm.prank(alice);
        vm.expectRevert();
        tickets.mintBatch(alice, ids, amounts);
    }

    function test_mintBatch_increasesBalances() public {
        uint256[] memory ids = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);
        ids[0] = 1; ids[1] = 2;
        amounts[0] = 10; amounts[1] = 20;

        vm.prank(minter);
        tickets.mintBatch(alice, ids, amounts);

        assertEq(tickets.balanceOf(alice, 1), 10);
        assertEq(tickets.balanceOf(alice, 2), 20);
    }

    // ─── setImageURI ──────────────────────────────────────────────

    function test_setImageURI_onlyAdmin() public {
        vm.prank(minter);
        vm.expectRevert();
        tickets.setImageURI("https://poster.png");
    }

    function test_setImageURI_storesValue() public {
        vm.prank(admin);
        tickets.setImageURI("https://poster.png");
        assertEq(tickets.imageURI(), "https://poster.png");
    }

    // ─── totalSupply ──────────────────────────────────────────────

    function test_totalSupply_trackedPerTokenId() public {
        vm.prank(minter);
        tickets.mint(alice, 1, 30);
        assertEq(tickets.totalSupply(1), 30);
    }

    // ─── UUPS Upgrade ─────────────────────────────────────────────

    function test_upgrade_onlyDefaultAdmin() public {
        EventTickets newImpl = new EventTickets();

        vm.prank(alice);
        vm.expectRevert();
        tickets.upgradeToAndCall(address(newImpl), "");

        vm.prank(admin);
        tickets.upgradeToAndCall(address(newImpl), "");
    }

    // ─── supportsInterface ────────────────────────────────────────

    function test_supportsInterface_ERC1155() public view {
        assertTrue(tickets.supportsInterface(0xd9b67a26)); // ERC1155
    }
}
