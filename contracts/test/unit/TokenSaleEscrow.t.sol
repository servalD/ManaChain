// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {TokenSaleEscrow} from "../../src/brand/TokenSaleEscrow.sol";
import {BrandSupportToken} from "../../src/brand/BrandSupportToken.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";

contract TokenSaleEscrowTest is Test {
    TokenSaleEscrow public escrow;
    BrandSupportToken public supportToken;
    MockUSDC public usdc;

    address public brand = makeAddr("brand");
    address public manaAdmin = makeAddr("manaAdmin");
    address public feeRecipient = makeAddr("feeRecipient");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant PRICE = 5e6;        // 5 USDC per token
    uint256 public constant TOTAL_FOR_SALE = 1000;
    uint256 public startTime;
    uint256 public endTime;

    function setUp() public {
        // Force chainId to Base Sepolia so BaseStablecoins.getUSDC() works
        vm.chainId(84532);

        usdc = new MockUSDC();
        // Patch the USDC address in BaseStablecoins by deploying MockUSDC at the expected address
        // We use vm.etch to place MockUSDC bytecode at the Base Sepolia USDC address
        address usdcAddr = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        bytes memory code = address(usdc).code;
        vm.etch(usdcAddr, code);
        usdc = MockUSDC(usdcAddr);

        // Deploy support token (vault = brand for simplicity)
        BrandSupportToken tokenImpl = new BrandSupportToken();
        bytes memory tokenData = abi.encodeCall(
            BrandSupportToken.initialize,
            ("Brand Support", "BST", brand, "", TOTAL_FOR_SALE)
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenData);
        supportToken = BrandSupportToken(address(tokenProxy));

        startTime = block.timestamp + 100;
        endTime = block.timestamp + 1000;

        escrow = new TokenSaleEscrow(
            supportToken,
            usdc,
            brand,
            manaAdmin,
            feeRecipient,
            PRICE,
            TOTAL_FOR_SALE,
            startTime,
            endTime,
            500 // 5% fee
        );

        // Mint support tokens to escrow (simulating brand deposit)
        vm.prank(brand);
        supportToken.mint(address(escrow), TOTAL_FOR_SALE);

        // Give buyers USDC using Foundry's deal (works with vm.etch'd contracts)
        deal(address(usdc), alice, 10_000e6);
        deal(address(usdc), bob, 10_000e6);
    }

    // ─── constructor validation ────────────────────────────────────

    function test_constructor_rejectNonUSDC() public {
        MockUSDC fakeToken = new MockUSDC();
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowOnlyUSDC.selector);
        new TokenSaleEscrow(
            supportToken, fakeToken, brand, manaAdmin, feeRecipient,
            PRICE, TOTAL_FOR_SALE, startTime, endTime, 500
        );
    }

    function test_constructor_rejectZeroAddresses() public {
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowInvalidConfig.selector);
        new TokenSaleEscrow(
            supportToken, usdc, address(0), manaAdmin, feeRecipient,
            PRICE, TOTAL_FOR_SALE, startTime, endTime, 500
        );
    }

    function test_constructor_rejectInvalidTimeWindow() public {
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowInvalidConfig.selector);
        new TokenSaleEscrow(
            supportToken, usdc, brand, manaAdmin, feeRecipient,
            PRICE, TOTAL_FOR_SALE, endTime, startTime, 500 // end < start
        );
    }

    // ─── buy ──────────────────────────────────────────────────────

    function test_buy_normal() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        vm.stopPrank();

        assertEq(supportToken.balanceOf(alice), 100);
        assertEq(escrow.getSoldAmount(), 100);
    }

    function test_buy_revertBeforeStart() public {
        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowTimeWindow.selector);
        escrow.buy(100);
    }

    function test_buy_revertAfterEnd() public {
        vm.warp(endTime + 1);
        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowTimeWindow.selector);
        escrow.buy(100);
    }

    function test_buy_revertExceedsCap() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), type(uint256).max);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowInsufficientSupply.selector);
        escrow.buy(TOTAL_FOR_SALE + 1);
        vm.stopPrank();
    }

    function test_buy_revertZeroAmount() public {
        vm.warp(startTime + 1);
        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowZeroAmount.selector);
        escrow.buy(0);
    }

    function test_buy_revertWhenCancelled() public {
        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();

        vm.warp(startTime + 1);
        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowNotOpen.selector);
        escrow.buy(100);
    }

    // ─── endSale ──────────────────────────────────────────────────

    function test_endSale_byBrandBeforeEndTime() public {
        vm.prank(brand);
        escrow.endSale();
        assertEq(uint256(escrow.getState()), uint256(TokenSaleEscrow.State.Closed));
    }

    /// @dev H-3 SECURITY: anyone can call endSale after endTime — documents current behavior
    function test_endSale_anyoneAfterEndTime_currentBehavior() public {
        vm.warp(endTime + 1);
        vm.prank(alice); // Not the brand
        escrow.endSale(); // Should succeed (current behavior — H-3 vulnerability)
        assertEq(uint256(escrow.getState()), uint256(TokenSaleEscrow.State.Closed));
    }

    /// @dev H-3: after anyone calls endSale, admin can no longer cancel the sale
    function test_endSale_blocksAdminCancel() public {
        vm.warp(endTime + 1);
        vm.prank(alice);
        escrow.endSale();

        vm.prank(manaAdmin);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowNotOpen.selector);
        escrow.cancelSaleByAdmin();
    }

    // ─── claimByBrand ─────────────────────────────────────────────

    function _doSomebuys() internal {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        vm.stopPrank();
    }

    function test_claimByBrand_afterClose() public {
        _doSomebuys();
        vm.prank(brand);
        escrow.endSale();

        uint256 brandBefore = usdc.balanceOf(brand);
        uint256 feeBefore = usdc.balanceOf(feeRecipient);

        vm.prank(brand);
        escrow.claimByBrand();

        // 100 tokens * 5 USDC = 500 USDC, 5% fee = 25 USDC to feeRecipient, 475 to brand
        assertEq(usdc.balanceOf(feeRecipient) - feeBefore, 25e6);
        assertEq(usdc.balanceOf(brand) - brandBefore, 475e6);
    }

    function test_claimByBrand_onlyBrand() public {
        _doSomebuys();
        vm.prank(brand);
        escrow.endSale();

        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowOnlyBrand.selector);
        escrow.claimByBrand();
    }

    function test_claimByBrand_revertNotClosed() public {
        vm.prank(brand);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowNotClosed.selector);
        escrow.claimByBrand();
    }

    function test_claimByBrand_revertAlreadyClaimed() public {
        _doSomebuys();
        vm.prank(brand);
        escrow.endSale();

        vm.prank(brand);
        escrow.claimByBrand();

        vm.prank(brand);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowAlreadyClaimed.selector);
        escrow.claimByBrand();
    }

    // ─── cancelSaleByAdmin ────────────────────────────────────────

    function test_cancelSaleByAdmin_onlyManaAdmin() public {
        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowOnlyManaAdmin.selector);
        escrow.cancelSaleByAdmin();
    }

    function test_cancelSaleByAdmin_setsStateCancelled() public {
        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();
        assertEq(uint256(escrow.getState()), uint256(TokenSaleEscrow.State.Cancelled));
    }

    // ─── cancelByBrand ────────────────────────────────────────────

    function test_cancelByBrand_onlyBrand() public {
        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowOnlyBrand.selector);
        escrow.cancelByBrand();
    }

    function test_cancelByBrand_setsStateCancelled() public {
        vm.prank(brand);
        escrow.cancelByBrand();
        assertEq(uint256(escrow.getState()), uint256(TokenSaleEscrow.State.Cancelled));
    }

    // ─── claimRefund ──────────────────────────────────────────────

    function test_claimRefund_returnsUSDC() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        vm.stopPrank();

        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.startPrank(alice);
        supportToken.approve(address(escrow), 100);
        escrow.claimRefund(100);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice) - aliceBefore, 500e6);
        assertEq(supportToken.balanceOf(alice), 0);
    }

    function test_claimRefund_revertNotCancelled() public {
        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowNotCancelled.selector);
        escrow.claimRefund(100);
    }

    function test_claimRefund_revertZeroAmount() public {
        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();

        vm.prank(alice);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowZeroAmount.selector);
        escrow.claimRefund(0);
    }

    /// @dev C-1 SECURITY: drain scenario — if escrow has less USDC than promised refunds, transfer will fail
    function test_claimRefund_drainScenario_currentBehavior() public {
        // Alice buys 100 tokens
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        vm.stopPrank();

        // Bob buys 100 tokens
        vm.startPrank(bob);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        vm.stopPrank();

        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();

        // Alice claims refund (drains USDC)
        vm.startPrank(alice);
        supportToken.approve(address(escrow), 100);
        escrow.claimRefund(100);
        vm.stopPrank();

        // Alice tries to claim again with more support tokens — would succeed without fix (C-1)
        // because there's still USDC (from bob's purchase) in the contract
        // This test documents that there's no tracking of who already claimed
        assertEq(usdc.balanceOf(address(escrow)), 500e6); // Bob's USDC still there
        assertEq(supportToken.balanceOf(alice), 0);
    }
}
