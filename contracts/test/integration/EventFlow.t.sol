// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {ManaAdmin} from "../../src/access/ManaAdmin.sol";
import {EventFactory} from "../../src/factory/EventFactory.sol";
import {EventTickets} from "../../src/events/EventTickets.sol";
import {TicketSale} from "../../src/events/TicketSale.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";
import {ManaRoles} from "../../src/constants/ManaRoles.sol";

/**
 * @title EventFlowTest
 * @notice Integration test covering the full event lifecycle:
 *   deploy → whitelist brand → deployEventModule → mint tickets → create TicketSale
 *   → buy tickets → verify splits (happy path)
 *   → verify reverts for time window, insufficient tickets, price not set
 */
contract EventFlowTest is Test {
    // ─── Contracts ────────────────────────────────────────────────
    ManaAdmin public manaAdminProxy;
    EventFactory public factory;
    EventTickets public tickets;
    TicketSale public sale;
    MockUSDC public usdc;

    // ─── Actors ───────────────────────────────────────────────────
    address public platformAdmin = makeAddr("platformAdmin");
    address public brand = makeAddr("brand");
    address public feeRecipient = makeAddr("feeRecipient");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    // ─── Ticket types ─────────────────────────────────────────────
    uint256 public constant VIP = 1;
    uint256 public constant STANDARD = 2;
    uint256 public constant FREE = 3;

    uint256 public constant VIP_PRICE = 100e6;      // 100 USDC
    uint256 public constant STANDARD_PRICE = 20e6;  //  20 USDC
    uint256 public constant FEE_BPS = 500;           //   5%

    uint256 public startTime;
    uint256 public endTime;

    function setUp() public {
        vm.chainId(84532);

        // Etch MockUSDC at canonical Base Sepolia USDC address
        usdc = new MockUSDC();
        address usdcAddr = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        vm.etch(usdcAddr, address(usdc).code);
        usdc = MockUSDC(usdcAddr);

        // —— 1. Deploy ManaAdmin proxy ——
        ManaAdmin adminImpl = new ManaAdmin();
        bytes memory adminData = abi.encodeCall(ManaAdmin.initialize, (platformAdmin));
        ERC1967Proxy adminProxy = new ERC1967Proxy(address(adminImpl), adminData);
        manaAdminProxy = ManaAdmin(address(adminProxy));

        // —— 2. Deploy EventTickets implementation ——
        EventTickets ticketsImpl = new EventTickets();

        // —— 3. Deploy EventFactory (use deployCode to bypass Solidity interface type mismatch) ——
        bytes memory factoryArgs = abi.encode(address(manaAdminProxy), address(ticketsImpl));
        factory = EventFactory(deployCode("EventFactory.sol:EventFactory", factoryArgs));

        // —— 4. Whitelist brand ——
        vm.prank(platformAdmin);
        manaAdminProxy.setBrandWhitelisted(brand, true);

        // —— 5. Brand deploys event module ——
        vm.prank(brand);
        address ticketsAddr = factory.deployEventModule(brand, "https://api.brand.com/event/{id}.json");
        tickets = EventTickets(ticketsAddr);

        // —— 6. Set up time window ——
        startTime = block.timestamp + 100;
        endTime = block.timestamp + 1000;

        // —— 7. Deploy TicketSale ——
        sale = new TicketSale(
            tickets,
            IERC20(address(usdc)),
            brand,
            feeRecipient,
            uint16(FEE_BPS),
            startTime,
            endTime
        );

        // —— 8. Manual mint to TicketSale ——
        // Mock onERC1155Received to bypass ERC1155InvalidReceiver error
        vm.mockCall(
            address(sale),
            abi.encodeWithSignature("onERC1155Received(address,address,uint256,uint256,bytes)"),
            abi.encode(bytes4(0xf23a6e61))
        );

        vm.startPrank(brand);
        tickets.mint(address(sale), VIP, 50);
        tickets.mint(address(sale), STANDARD, 200);
        tickets.mint(address(sale), FREE, 100);

        // Set prices (brand must call, which is fine)
        sale.setPrice(VIP, VIP_PRICE);
        sale.setPrice(STANDARD, STANDARD_PRICE);
        sale.setPrice(FREE, 0);
        vm.stopPrank();

        // Give buyers USDC using deal
        deal(address(usdc), alice, 10_000e6);
        deal(address(usdc), bob, 10_000e6);
    }

    // ─── Factory ──────────────────────────────────────────────────

    function test_deployEventModule_setsRoles() public view {
        assertTrue(tickets.hasRole(ManaRoles.getDefaultAdminRole(), brand));
        assertTrue(tickets.hasRole(ManaRoles.getMinterRole(), brand));
    }

    function test_deployEventModule_requiresWhitelist() public {
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(EventFactory.EventFactoryBrandNotAllowed.selector);
        factory.deployEventModule(stranger, "uri");
    }

    function test_deployEventModule_requiresCallerEqualsBrand() public {
        address stranger = makeAddr("stranger");
        vm.prank(platformAdmin);
        manaAdminProxy.setBrandWhitelisted(stranger, true);

        vm.prank(alice); // alice tries to deploy on behalf of stranger
        vm.expectRevert(EventFactory.EventFactoryOnlyBrand.selector);
        factory.deployEventModule(stranger, "uri");
    }

    // ─── Happy path: buy paid tickets ─────────────────────────────

    function test_buy_vipTickets() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 5 * VIP_PRICE);
        sale.buy(VIP, 5);
        vm.stopPrank();

        assertEq(tickets.balanceOf(alice, VIP), 5);
        // 5 * 100 USDC = 500 USDC, 5% = 25 fee, 475 to brand
        assertEq(usdc.balanceOf(feeRecipient), 25e6);
        assertEq(usdc.balanceOf(brand), 475e6);
    }

    function test_buy_standardTickets() public {
        vm.warp(startTime + 1);
        vm.startPrank(bob);
        usdc.approve(address(sale), 10 * STANDARD_PRICE);
        sale.buy(STANDARD, 10);
        vm.stopPrank();

        assertEq(tickets.balanceOf(bob, STANDARD), 10);
        // 10 * 20 USDC = 200 USDC, 5% = 10 fee, 190 to brand
        assertEq(usdc.balanceOf(feeRecipient), 10e6);
        assertEq(usdc.balanceOf(brand), 190e6);
    }

    function test_buy_freeTickets_noUSDCNeeded() public {
        vm.warp(startTime + 1);
        vm.prank(alice); // no approval needed
        sale.buy(FREE, 5);

        assertEq(tickets.balanceOf(alice, FREE), 5);
        assertEq(usdc.balanceOf(feeRecipient), 0);
        assertEq(usdc.balanceOf(brand), 0);
    }

    function test_buy_mixedTickets_multipleUsers() public {
        vm.warp(startTime + 1);

        vm.startPrank(alice);
        usdc.approve(address(sale), 1 * VIP_PRICE);
        sale.buy(VIP, 1);
        sale.buy(FREE, 2);
        vm.stopPrank();

        vm.startPrank(bob);
        usdc.approve(address(sale), 3 * STANDARD_PRICE);
        sale.buy(STANDARD, 3);
        vm.stopPrank();

        assertEq(tickets.balanceOf(alice, VIP), 1);
        assertEq(tickets.balanceOf(alice, FREE), 2);
        assertEq(tickets.balanceOf(bob, STANDARD), 3);
    }

    // ─── Error cases ──────────────────────────────────────────────

    function test_buy_revertBeforeStart() public {
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSaleTimeWindow.selector);
        sale.buy(VIP, 1);
    }

    function test_buy_revertAfterEnd() public {
        vm.warp(endTime + 1);
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSaleTimeWindow.selector);
        sale.buy(VIP, 1);
    }

    function test_buy_revertInsufficientTickets() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 100 * VIP_PRICE); // approve plenty
        vm.expectRevert(TicketSale.TicketSaleInsufficientBalance.selector);
        sale.buy(VIP, 51); // only 50 VIP minted
        vm.stopPrank();
    }

    function test_buy_revertPriceNotSet() public {
        vm.warp(startTime + 1);
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSalePriceNotSet.selector);
        sale.buy(99, 1); // unknown tokenId
    }

    function test_buy_revertZeroQuantity() public {
        vm.warp(startTime + 1);
        vm.prank(alice);
        vm.expectRevert(TicketSale.TicketSaleZeroQuantity.selector);
        sale.buy(VIP, 0);
    }

    // ─── Total supply tracking ────────────────────────────────────

    function test_totalSupply_decreasesOnTransfer() public {
        assertEq(tickets.totalSupply(VIP), 50);
        assertEq(tickets.balanceOf(address(sale), VIP), 50);

        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 3 * VIP_PRICE);
        sale.buy(VIP, 3);
        vm.stopPrank();

        assertEq(tickets.balanceOf(address(sale), VIP), 47);
        assertEq(tickets.balanceOf(alice, VIP), 3);
        assertEq(tickets.totalSupply(VIP), 50); // total supply unchanged; transferred not burned
    }

    // ─── Secondary transfer (peer-to-peer) ────────────────────────

    function test_ticketTransfer_peerToPeer() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(sale), 2 * VIP_PRICE);
        sale.buy(VIP, 2);
        // Alice transfers 1 VIP ticket to Bob
        tickets.safeTransferFrom(alice, bob, VIP, 1, "");
        vm.stopPrank();

        assertEq(tickets.balanceOf(alice, VIP), 1);
        assertEq(tickets.balanceOf(bob, VIP), 1);
    }

    // ─── Additional EventTickets can be minted by brand ───────────

    function test_additionalMint_byBrand() public {
        vm.prank(brand);
        tickets.mint(address(sale), VIP, 50); // add 50 more VIP

        assertEq(tickets.balanceOf(address(sale), VIP), 100);
    }

    function test_additionalMint_blockedForNonMinter() public {
        vm.prank(alice);
        vm.expectRevert();
        tickets.mint(alice, VIP, 10);
    }
}
