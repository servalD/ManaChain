// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {TokenSaleEscrow} from "../../src/brand/TokenSaleEscrow.sol";
import {BrandSupportToken} from "../../src/brand/BrandSupportToken.sol";
import {MockUSDC} from "../mocks/MockUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
            ("Brand Support", "BST", brand, "", TOTAL_FOR_SALE * 2)
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

    /// @dev H-3 SECURITY: TDD Test — Must revert if caller is not brand
    function test_endSale_anyoneAfterEndTime() public {
        vm.warp(endTime + 1);
        vm.prank(alice); // Not the brand
        vm.expectRevert(); // Expect revert. Currently doesn't, so test fails!
        escrow.endSale();
    }

    /// @dev H-3: after anyone calls endSale, admin can no longer cancel the sale
    function test_endSale_blockAdminCancel() public {
        vm.warp(endTime + 1);
        vm.prank(brand);
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

    /// @dev C-1 SECURITY: TDD Test — Alice must be able to claim her refund successfully
    function test_claimRefund_fullDrain() public {
        // Alice buys 100 tokens, Escrow has 500 USDC
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        vm.stopPrank();

        // Admin cancels sale
        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();

        // Brand uses 100 extra tokens (minted outside sale) to drain refunds
        vm.prank(brand);
        supportToken.mint(brand, 100);

        vm.startPrank(brand);
        supportToken.approve(address(escrow), 100);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowOnlyBrand.selector);
        escrow.claimRefund(100);
        vm.stopPrank();

        // Alice tries to refund her valid 100 tokens
        vm.startPrank(alice);
        supportToken.approve(address(escrow), 100);
        escrow.claimRefund(100); // Should succeed! Will currently REVERT (test fails) because contract is drained
        vm.stopPrank();
    }

    /// @dev C-1 SECURITY: doubleRefund fails because tokens are reclaimed by contract
    function test_claimRefund_doubleRefund() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        vm.stopPrank();

        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();

        vm.startPrank(alice);
        supportToken.approve(address(escrow), 100);
        escrow.claimRefund(100);

        // Try second refund without tokens
        vm.expectRevert(); // safeTransferFrom fails
        escrow.claimRefund(100);
        vm.stopPrank();
    }

    /// @dev C-1 SECURITY: proRata refund logic - transferred tokens refund correct owner
    function test_claimRefund_proRata() public {
        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100);
        
        // Alice transfers half to Bob
        supportToken.transfer(bob, 50);
        vm.stopPrank();

        vm.prank(manaAdmin);
        escrow.cancelSaleByAdmin();

        // Bob claims 50
        uint256 bobBalBefore = usdc.balanceOf(bob);
        vm.startPrank(bob);
        supportToken.approve(address(escrow), 50);
        escrow.claimRefund(50);
        vm.stopPrank();
        assertEq(usdc.balanceOf(bob) - bobBalBefore, 250e6); // Half refund
    }

    /// @dev M-2 SECURITY: buy without deposit
    function test_buy_withoutDeposit() public {
        // Deploy a new escrow without sending support tokens
        TokenSaleEscrow badEscrow = new TokenSaleEscrow(
            IERC20(address(supportToken)),
            IERC20(address(usdc)),
            brand,
            manaAdmin,
            feeRecipient,
            PRICE,
            100,
            startTime,
            endTime,
            500
        );

        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(address(badEscrow), 500e6);
        
        // Buy fails because contract has no support tokens to transfer
        vm.expectRevert(); // safeTransfer fails
        badEscrow.buy(100);
        vm.stopPrank();
    }
}
