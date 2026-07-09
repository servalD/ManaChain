// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {TicketSale} from "../../src/events/TicketSale.sol";
import {EventTickets} from "../../src/events/EventTickets.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";
import {ManaRoles} from "../../src/constants/ManaRoles.sol";

contract TicketSaleTest is Test {
    TicketSale public sale;
    EventTickets public tickets;
    MockUSDC public usdc;

    address public brand = makeAddr("brand");
    address public feeRecipient = makeAddr("feeRecipient");
    address public alice = makeAddr("alice");

    uint256 public tokenId = 1; // VIP ticket
    uint256 public constant TICKET_PRICE = 10e6; // 10 USDC
    uint256 public startTime;
    uint256 public endTime;

    function setUp() public {
        usdc = new MockUSDC();

        // Deploy EventTickets
        EventTickets impl = new EventTickets();
        bytes memory data = abi.encodeCall(EventTickets.initialize, ("https://api.example.com/{id}.json", brand));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        tickets = EventTickets(address(proxy));

        startTime = block.timestamp + 100;
        endTime = block.timestamp + 1000;

        sale = new TicketSale(
            tickets,
            usdc,
            brand,
            feeRecipient,
            500, // 5% fee
            startTime,
            endTime
        );

        // Mint tickets to the sale contract (TicketSale is an ERC1155Holder)
        vm.prank(brand);
        tickets.mint(address(sale), tokenId, 100);

        // Set price
        vm.prank(brand);
        sale.setPrice(tokenId, TICKET_PRICE);

        // Give alice USDC
        deal(address(usdc), alice, 10_000e6);
    }

    // ─── constructor validation ────────────────────────────────────

    function test_constructor_rejectZeroAddress() public {
        vm.expectRevert(TicketSale.TicketSaleInvalidConfig.selector);
        new TicketSale(tickets, usdc, address(0), feeRecipient, 500, startTime, endTime);
    }

    function test_constructor_rejectInvalidTimeWindow() public {
        vm.expectRevert(TicketSale.TicketSaleInvalidConfig.selector);
        new TicketSale(tickets, usdc, brand, feeRecipient, 500, endTime, startTime);
    }

    function test_constructor_rejectFeeOnFreeEvent() public {
        // paymentToken = address(0) + feeBps != 0 → should revert
        vm.expectRevert(TicketSale.TicketSaleInvalidConfig.selector);
        new TicketSale(tickets, IERC20(address(0)), brand, feeRecipient, 500, startTime, endTime);
    }

    function test_constructor_freeEventNoFee() public {
        // paymentToken = address(0) + feeBps = 0 → valid
        TicketSale freeSale = new TicketSale(
            tickets, IERC20(address(0)), brand, feeRecipient, 0, startTime, endTime
        );
        assertEq(address(freeSale.paymentToken()), address(0));
    }

    // ─── setPrice ─────────────────────────────────────────────────

    function test_setPrice_onlyBrand() public {
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSaleOnlyBrand.selector);
        sale.setPrice(2, 5e6);
    }

    function test_setPrice_storesValue() public {
        vm.prank(brand);
        sale.setPrice(2, 20e6);
        (uint256 price, bool priceSet) = sale.getPrice(2);
        assertEq(price, 20e6);
        assertTrue(priceSet);
    }

    // ─── buy ──────────────────────────────────────────────────────

    function test_buy_normal() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 50e6);
        sale.buy(tokenId, 5);
        vm.stopPrank();

        assertEq(tickets.balanceOf(alice, tokenId), 5);
    }

    function test_buy_feeSplit() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 100e6); // 10 tickets * 10 USDC
        sale.buy(tokenId, 10);
        vm.stopPrank();

        // 100 USDC total, 5% = 5 USDC fee, 95 USDC to brand
        assertEq(usdc.balanceOf(feeRecipient), 5e6);
        assertEq(usdc.balanceOf(brand), 95e6);
    }

    function test_buy_revertBeforeStart() public {
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSaleTimeWindow.selector);
        sale.buy(tokenId, 1);
    }

    function test_buy_revertAfterEnd() public {
        vm.warp(endTime + 1);
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSaleTimeWindow.selector);
        sale.buy(tokenId, 1);
    }

    function test_buy_revertZeroQuantity() public {
        vm.warp(startTime + 1);
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSaleZeroQuantity.selector);
        sale.buy(tokenId, 0);
    }

    function test_buy_revertPriceNotSet() public {
        vm.warp(startTime + 1);
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSalePriceNotSet.selector);
        sale.buy(99, 1); // tokenId 99 never had price set
    }

    /// @dev H-1 SECURITY: ticket stock is checked BEFORE any payment transfer (CEI).
    function test_buy_insufficientTickets_noMoneyLost() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 2000e6);

        // 100 tickets in contract; try to buy 101 — reverts before touching USDC
        vm.expectRevert(TicketSale.TicketSaleInsufficientBalance.selector);
        sale.buy(tokenId, 101);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice), 10_000e6); // Alice's USDC unchanged
    }

    /// @dev H-1 SECURITY: Documenting that the event Bought is emitted at the very end
    function test_buy_correctOrder() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 50e6);
        
        vm.expectEmit(true, true, false, true);
        emit TicketSale.Bought(alice, tokenId, 5, 5 * TICKET_PRICE);
        sale.buy(tokenId, 5);
        vm.stopPrank();
    }

    function test_buy_freeTicket() public {
        // Set price to 0 for tokenId 2
        vm.prank(brand);
        sale.setPrice(2, 0);

        vm.prank(brand);
        tickets.mint(address(sale), 2, 50);

        vm.warp(startTime + 1);
        vm.prank(alice); // no USDC approval needed
        sale.buy(2, 3);

        assertEq(tickets.balanceOf(alice, 2), 3);
        assertEq(usdc.balanceOf(feeRecipient), 0); // no fee on free tickets
    }
}
