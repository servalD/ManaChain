// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {ManaAdmin} from "../../src/access/ManaAdmin.sol";
import {BrandFactory} from "../../src/factory/BrandFactory.sol";
import {BrandGenesisNFT} from "../../src/brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../../src/brand/FractionalVault.sol";
import {BrandSupportToken} from "../../src/brand/BrandSupportToken.sol";
import {TokenSaleEscrow} from "../../src/brand/TokenSaleEscrow.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";
import {ManaRoles} from "../../src/constants/ManaRoles.sol";

/**
 * @title BrandFlowTest
 * @notice Integration test covering the full brand lifecycle:
 *   deploy → whitelist → deployBrandModule → mint Genesis NFT → mint support tokens
 *   → run TokenSaleEscrow → buy → endSale → claimByBrand (happy path)
 *   → replay with cancel → claimRefund (refund path)
 */
contract BrandFlowTest is Test {
    // ─── Contracts ────────────────────────────────────────────────
    ManaAdmin public manaAdminProxy;
    BrandFactory public factory;

    BrandGenesisNFT public genesisNFT;
    FractionalVault public vault;
    BrandSupportToken public supportToken;

    MockUSDC public usdc;

    // ─── Actors ───────────────────────────────────────────────────
    address public platformAdmin = makeAddr("platformAdmin");
    address public brand = makeAddr("brand");
    address public feeRecipient = makeAddr("feeRecipient");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    // ─── Constants ────────────────────────────────────────────────
    uint256 public constant PRICE = 5e6;           // 5 USDC per support token
    uint256 public constant TOTAL_FOR_SALE = 1000e18;
    uint256 public constant FEE_BPS = 500;          // 5%

    function setUp() public {
        usdc = new MockUSDC();

        // —— 1. Deploy ManaAdmin proxy ——
        ManaAdmin adminImpl = new ManaAdmin();
        bytes memory adminData = abi.encodeCall(ManaAdmin.initialize, (platformAdmin));
        ERC1967Proxy adminProxy = new ERC1967Proxy(address(adminImpl), adminData);
        manaAdminProxy = ManaAdmin(address(adminProxy));

        // Set fee recipient and primary fee
        vm.startPrank(platformAdmin);
        manaAdminProxy.setFeeRecipient(feeRecipient);
        manaAdminProxy.setFeePrimary(FEE_BPS);
        vm.stopPrank();

        // —— 2. Deploy implementations ——
        BrandGenesisNFT nftImpl = new BrandGenesisNFT();
        FractionalVault vaultImpl = new FractionalVault();
        BrandSupportToken tokenImpl = new BrandSupportToken();

        // —— 3. Deploy BrandFactory (use deployCode to bypass Solidity interface type mismatch) ——
        bytes memory factoryArgs = abi.encode(
            address(manaAdminProxy),
            address(nftImpl),
            address(vaultImpl),
            address(tokenImpl)
        );
        factory = BrandFactory(deployCode("BrandFactory.sol:BrandFactory", factoryArgs));

        // —— 4. Whitelist brand ——
        vm.prank(platformAdmin);
        manaAdminProxy.setBrandWhitelisted(brand, true);

        // —— 5. Brand deploys its module ——
        vm.prank(brand);
        (address genesisNFTAddr, address vaultAddr, address supportTokenAddr) = factory.deployBrandModule(
            brand,
            "Acme Brand Genesis",
            "ACME",
            "Acme Support Token",
            "ACMEST",
            "https://acme.com/logo.png",
            TOTAL_FOR_SALE * 2  // cap = 2000 tokens
        );

        genesisNFT = BrandGenesisNFT(genesisNFTAddr);
        vault = FractionalVault(vaultAddr);
        supportToken = BrandSupportToken(supportTokenAddr);

        // Give buyers USDC using deal
        deal(address(usdc), alice, 10_000e6);
        deal(address(usdc), bob, 10_000e6);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    function _mintGenesisAndDeposit() internal {
        vm.startPrank(brand);
        genesisNFT.mint(brand, 1, "ipfs://genesis-meta", "https://acme.com/nft.png");
        genesisNFT.approve(address(vault), 1);
        vault.depositGenesis(genesisNFT, 1);
        vm.stopPrank();
    }

    function _deployEscrow(uint256 startTime, uint256 endTime) internal returns (TokenSaleEscrow escrow) {
        escrow = new TokenSaleEscrow(
            IERC20(address(supportToken)),
            IERC20(address(usdc)),
            brand,
            address(manaAdminProxy),
            feeRecipient,
            PRICE,
            TOTAL_FOR_SALE,
            startTime,
            endTime,
            uint16(FEE_BPS)
        );

        // Brand mints support tokens directly to escrow (vault → escrow)
        vm.prank(brand);
        vault.mintSupport(address(escrow), TOTAL_FOR_SALE);
    }

    // ─── Module deployment ────────────────────────────────────────

    function test_deployBrandModule_setsCorrectOwners() public view {
        assertEq(vault.owner(), brand);
        assertEq(supportToken.vault(), address(vault));
        assertTrue(genesisNFT.hasRole(ManaRoles.getDefaultAdminRole(), brand));
    }

    function test_deployBrandModule_blocksDuplicateDeploy() public {
        vm.prank(brand);
        vm.expectRevert(BrandFactory.BrandFactoryAlreadyDeployed.selector);
        factory.deployBrandModule(brand, "X", "X", "X", "X", "", 0);
    }

    function test_deployBrandModule_requiresWhitelist() public {
        address newBrand = makeAddr("newBrand");
        vm.prank(newBrand);
        vm.expectRevert(BrandFactory.BrandFactoryBrandNotAllowed.selector);
        factory.deployBrandModule(newBrand, "X", "X", "X", "X", "", 0);
    }

    function test_deployBrandModule_blockedAfterBlacklist() public {
        address newBrand = makeAddr("newBrand");
        vm.prank(platformAdmin);
        manaAdminProxy.setBrandWhitelisted(newBrand, true);
        vm.prank(platformAdmin);
        manaAdminProxy.setBrandBlacklisted(newBrand, true);

        vm.prank(newBrand);
        vm.expectRevert(BrandFactory.BrandFactoryBrandNotAllowed.selector);
        factory.deployBrandModule(newBrand, "X", "X", "X", "X", "", 0);
    }

    // ─── Genesis NFT + Vault ──────────────────────────────────────

    function test_mintGenesisAndDepositToVault() public {
        _mintGenesisAndDeposit();
        assertEq(genesisNFT.ownerOf(1), address(vault));
        (address nftAddr,) = vault.getGenesisNFT();
        assertEq(nftAddr, address(genesisNFT));
    }

    // ─── Happy path: buy → endSale → claimByBrand ─────────────────

    function test_happyPath_buyAndClaim() public {
        _mintGenesisAndDeposit();

        uint256 startTime = block.timestamp + 10;
        uint256 endTime = block.timestamp + 1000;
        TokenSaleEscrow escrow = _deployEscrow(startTime, endTime);

        vm.warp(startTime + 1);

        // Alice buys 200 tokens = 1000 USDC
        vm.startPrank(alice);
        usdc.approve(address(escrow), 1000e6);
        escrow.buy(200e18);
        vm.stopPrank();

        // Bob buys 300 tokens = 1500 USDC
        vm.startPrank(bob);
        usdc.approve(address(escrow), 1500e6);
        escrow.buy(300e18);
        vm.stopPrank();

        assertEq(supportToken.balanceOf(alice), 200e18);
        assertEq(supportToken.balanceOf(bob), 300e18);
        assertEq(escrow.getSoldAmount(), 500e18);

        // Brand closes the sale
        vm.prank(brand);
        escrow.endSale();
        assertEq(uint256(escrow.getState()), uint256(TokenSaleEscrow.State.Closed));

        // Brand claims proceeds
        uint256 brandBefore = usdc.balanceOf(brand);
        uint256 feeBefore = usdc.balanceOf(feeRecipient);

        vm.prank(brand);
        escrow.claimByBrand();

        // Total USDC = 2500e6. Fee 5% = 125e6. Brand gets 2375e6
        assertEq(usdc.balanceOf(feeRecipient) - feeBefore, 125e6);
        assertEq(usdc.balanceOf(brand) - brandBefore, 2375e6);
    }

    // ─── Refund path: admin cancel → claimRefund ──────────────────

    function test_refundPath_adminCancelAndRefund() public {
        _mintGenesisAndDeposit();

        uint256 startTime = block.timestamp + 10;
        uint256 endTime = block.timestamp + 1000;
        TokenSaleEscrow escrow = _deployEscrow(startTime, endTime);

        vm.warp(startTime + 1);

        // Alice buys 100 tokens = 500 USDC
        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100e18);
        vm.stopPrank();

        uint256 aliceUSDCBefore = usdc.balanceOf(alice);

        // Admin cancels the sale
        vm.prank(platformAdmin);
        manaAdminProxy.cancelTokenSale(escrow);
        assertEq(uint256(escrow.getState()), uint256(TokenSaleEscrow.State.Cancelled));

        // Alice refunds her tokens
        vm.startPrank(alice);
        supportToken.approve(address(escrow), 100e18);
        escrow.claimRefund(100e18);
        vm.stopPrank();

        // Alice got her 500 USDC back
        assertEq(usdc.balanceOf(alice) - aliceUSDCBefore, 500e6);
        assertEq(supportToken.balanceOf(alice), 0);

        // Brand cannot claim after cancel
        vm.prank(brand);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowNotClosed.selector);
        escrow.claimByBrand();
    }

    // ─── Brand-initiated cancel ────────────────────────────────────

    function test_refundPath_brandCancelAndRefund() public {
        _mintGenesisAndDeposit();

        uint256 startTime = block.timestamp + 10;
        uint256 endTime = block.timestamp + 1000;
        TokenSaleEscrow escrow = _deployEscrow(startTime, endTime);

        vm.warp(startTime + 1);

        vm.startPrank(alice);
        usdc.approve(address(escrow), 500e6);
        escrow.buy(100e18);
        vm.stopPrank();

        vm.prank(brand);
        escrow.cancelByBrand();

        uint256 aliceBefore = usdc.balanceOf(alice);
        vm.startPrank(alice);
        supportToken.approve(address(escrow), 100e18);
        escrow.claimRefund(100e18);
        vm.stopPrank();

        assertEq(usdc.balanceOf(alice) - aliceBefore, 500e6);
    }

    // ─── Cap enforcement ──────────────────────────────────────────

    function test_buy_revertExceedsTotalForSale() public {
        _mintGenesisAndDeposit();

        uint256 startTime = block.timestamp + 10;
        uint256 endTime = block.timestamp + 1000;
        TokenSaleEscrow escrow = _deployEscrow(startTime, endTime);

        vm.warp(startTime + 1);

        vm.startPrank(alice);
        usdc.approve(address(escrow), type(uint256).max);
        vm.expectRevert(TokenSaleEscrow.TokenSaleEscrowInsufficientSupply.selector);
        escrow.buy(TOTAL_FOR_SALE + 1e18);
        vm.stopPrank();
    }
}
