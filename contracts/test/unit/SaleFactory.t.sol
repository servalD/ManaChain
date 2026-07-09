// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {ManaAdmin} from "../../src/access/ManaAdmin.sol";
import {IManaAdmin} from "../../src/interfaces/IManaAdmin.sol";
import {ISaleFactory} from "../../src/interfaces/ISaleFactory.sol";
import {BrandFactory} from "../../src/factory/BrandFactory.sol";
import {EventFactory} from "../../src/factory/EventFactory.sol";
import {SaleFactory} from "../../src/factory/SaleFactory.sol";
import {BrandGenesisNFT} from "../../src/brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../../src/brand/FractionalVault.sol";
import {BrandSupportToken} from "../../src/brand/BrandSupportToken.sol";
import {TokenSaleEscrow} from "../../src/brand/TokenSaleEscrow.sol";
import {EventTickets} from "../../src/events/EventTickets.sol";
import {TicketSale} from "../../src/events/TicketSale.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";

contract SaleFactoryTest is Test {
    ManaAdmin public manaAdminProxy;
    BrandFactory public brandFactory;
    EventFactory public eventFactory;
    SaleFactory public saleFactory;
    MockUSDC public usdc;

    BrandGenesisNFT public genesisNFT;
    FractionalVault public vault;
    BrandSupportToken public supportToken;

    address public platformAdmin = makeAddr("platformAdmin");
    address public brand = makeAddr("brand");
    address public feeRecipient = makeAddr("feeRecipient");
    address public alice = makeAddr("alice");

    uint256 public constant PRICE = 5e6; // 5 USDC per whole token
    uint256 public constant TOTAL_FOR_SALE = 1000e18;
    uint256 public constant FEE_BPS = 500; // 5%
    uint256 public startTime;
    uint256 public endTime;

    function setUp() public {
        usdc = new MockUSDC();

        // ManaAdmin proxy with fees configured
        ManaAdmin adminImpl = new ManaAdmin();
        manaAdminProxy = ManaAdmin(
            address(new ERC1967Proxy(address(adminImpl), abi.encodeCall(ManaAdmin.initialize, (platformAdmin))))
        );
        vm.startPrank(platformAdmin);
        manaAdminProxy.setFeeRecipient(feeRecipient);
        manaAdminProxy.setFeePrimary(FEE_BPS);
        manaAdminProxy.setBrandWhitelisted(brand, true);
        vm.stopPrank();

        // Factories
        BrandGenesisNFT nftImpl = new BrandGenesisNFT();
        FractionalVault vaultImpl = new FractionalVault();
        BrandSupportToken tokenImpl = new BrandSupportToken();
        EventTickets ticketsImpl = new EventTickets();
        brandFactory = new BrandFactory(
            IManaAdmin(address(manaAdminProxy)), address(nftImpl), address(vaultImpl), address(tokenImpl)
        );
        eventFactory = new EventFactory(IManaAdmin(address(manaAdminProxy)), address(ticketsImpl));
        saleFactory = new SaleFactory(IManaAdmin(address(manaAdminProxy)), brandFactory, eventFactory, usdc);

        // Brand module + genesis deposit
        vm.startPrank(brand);
        (address nftAddr, address vaultAddr, address tokenAddr) =
            brandFactory.deployBrandModule(brand, "Acme Genesis", "ACME", "Acme Support", "ACMEST", "", 0);
        genesisNFT = BrandGenesisNFT(nftAddr);
        vault = FractionalVault(vaultAddr);
        supportToken = BrandSupportToken(tokenAddr);
        genesisNFT.mint(brand, 1, "ipfs://genesis", "");
        genesisNFT.approve(vaultAddr, 1);
        vault.depositGenesis(genesisNFT, 1);
        vm.stopPrank();

        startTime = block.timestamp + 100;
        endTime = block.timestamp + 1000;

        deal(address(usdc), alice, 10_000e6);
    }

    // ─── BrandFactory registry ────────────────────────────────────

    function test_brandFactory_registryPopulated() public view {
        assertEq(brandFactory.genesisNFTOf(brand), address(genesisNFT));
        assertEq(brandFactory.vaultOf(brand), address(vault));
        assertEq(brandFactory.supportTokenOf(brand), address(supportToken));
        assertEq(brandFactory.brandOfVault(address(vault)), brand);
    }

    // ─── openSale → deployTokenSale ───────────────────────────────

    function test_openSale_deploysFundsAndLinksEscrow() public {
        vm.prank(brand);
        address escrowAddr = vault.openSale(saleFactory, PRICE, TOTAL_FOR_SALE, startTime, endTime);

        TokenSaleEscrow escrow = TokenSaleEscrow(escrowAddr);
        assertEq(escrow.brand(), brand);
        assertEq(escrow.manaAdmin(), address(manaAdminProxy));
        assertEq(escrow.feeRecipient(), feeRecipient);
        assertEq(escrow.feeBps(), uint16(FEE_BPS));
        assertEq(address(escrow.paymentToken()), address(usdc));
        assertEq(address(escrow.supportToken()), address(supportToken));
        // Funded and linked in the same transaction (audit M-2 closed structurally)
        assertEq(supportToken.balanceOf(escrowAddr), TOTAL_FOR_SALE);
        assertEq(vault.getEscrow(), escrowAddr);
    }

    function test_openSale_emitsTokenSaleDeployed() public {
        // topic2 (escrow address) is unknown before deployment: skip it
        vm.expectEmit(true, false, true, true, address(saleFactory));
        emit SaleFactory.TokenSaleDeployed(
            brand, address(0), address(supportToken), PRICE, TOTAL_FOR_SALE, startTime, endTime
        );
        vm.prank(brand);
        vault.openSale(saleFactory, PRICE, TOTAL_FOR_SALE, startTime, endTime);
    }

    function test_openSale_buyWorks() public {
        vm.prank(brand);
        address escrowAddr = vault.openSale(saleFactory, PRICE, TOTAL_FOR_SALE, startTime, endTime);

        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(escrowAddr, 500e6);
        TokenSaleEscrow(escrowAddr).buy(100e18);
        vm.stopPrank();

        assertEq(supportToken.balanceOf(alice), 100e18);
        assertEq(usdc.balanceOf(escrowAddr), 500e6);
    }

    function test_openSale_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.openSale(saleFactory, PRICE, TOTAL_FOR_SALE, startTime, endTime);
    }

    function test_openSale_requiresGenesisDeposited() public {
        // Fresh brand with a module but no genesis deposited
        address brand2 = makeAddr("brand2");
        vm.prank(platformAdmin);
        manaAdminProxy.setBrandWhitelisted(brand2, true);
        vm.startPrank(brand2);
        (, address vault2Addr,) = brandFactory.deployBrandModule(brand2, "B2", "B2", "B2T", "B2T", "", 0);
        vm.expectRevert(FractionalVault.FractionalVaultGenesisNotDeposited.selector);
        FractionalVault(vault2Addr).openSale(saleFactory, PRICE, TOTAL_FOR_SALE, startTime, endTime);
        vm.stopPrank();
    }

    function test_openSale_blockedWhenBlacklisted() public {
        vm.prank(platformAdmin);
        manaAdminProxy.setBrandBlacklisted(brand, true);

        vm.prank(brand);
        vm.expectRevert(SaleFactory.SaleFactoryBrandNotAllowed.selector);
        vault.openSale(saleFactory, PRICE, TOTAL_FOR_SALE, startTime, endTime);
    }

    function test_deployTokenSale_directCallReverts() public {
        // Even the brand cannot call the factory directly: only its registered vault can
        vm.prank(brand);
        vm.expectRevert(SaleFactory.SaleFactoryOnlyVault.selector);
        saleFactory.deployTokenSale(brand, PRICE, TOTAL_FOR_SALE, startTime, endTime);

        vm.prank(alice);
        vm.expectRevert(SaleFactory.SaleFactoryOnlyVault.selector);
        saleFactory.deployTokenSale(brand, PRICE, TOTAL_FOR_SALE, startTime, endTime);
    }

    // ─── deployTicketSale ─────────────────────────────────────────

    function _deployEventModule() internal returns (address ticketsAddr) {
        vm.prank(brand);
        ticketsAddr = eventFactory.deployEventModule(brand, "https://api.acme.com/event/{id}.json");
    }

    function test_deployTicketSale_paidEvent() public {
        address ticketsAddr = _deployEventModule();
        assertEq(eventFactory.brandOfEventTickets(ticketsAddr), brand);

        vm.prank(brand);
        address saleAddr = saleFactory.deployTicketSale(ticketsAddr, false, startTime, endTime);

        TicketSale sale = TicketSale(saleAddr);
        assertEq(sale.brand(), brand);
        assertEq(address(sale.paymentToken()), address(usdc));
        assertEq(sale.feeBps(), uint16(FEE_BPS));
        assertEq(sale.feeRecipient(), feeRecipient);

        // Brand mints tickets to the sale (ERC1155Holder) and sells one
        vm.startPrank(brand);
        EventTickets(ticketsAddr).mint(saleAddr, 1, 50);
        sale.setPrice(1, 10e6);
        vm.stopPrank();

        vm.warp(startTime + 1);
        vm.startPrank(alice);
        usdc.approve(saleAddr, 10e6);
        sale.buy(1, 1);
        vm.stopPrank();
        assertEq(EventTickets(ticketsAddr).balanceOf(alice, 1), 1);
    }

    function test_deployTicketSale_freeEvent() public {
        address ticketsAddr = _deployEventModule();

        vm.prank(brand);
        address saleAddr = saleFactory.deployTicketSale(ticketsAddr, true, startTime, endTime);

        TicketSale sale = TicketSale(saleAddr);
        assertEq(address(sale.paymentToken()), address(0));
        assertEq(sale.feeBps(), 0);

        vm.startPrank(brand);
        EventTickets(ticketsAddr).mint(saleAddr, 1, 50);
        sale.setPrice(1, 0);
        vm.stopPrank();

        vm.warp(startTime + 1);
        vm.prank(alice);
        sale.buy(1, 2);
        assertEq(EventTickets(ticketsAddr).balanceOf(alice, 1), 2);
    }

    function test_deployTicketSale_onlyBrand() public {
        address ticketsAddr = _deployEventModule();

        vm.prank(alice);
        vm.expectRevert(SaleFactory.SaleFactoryOnlyBrand.selector);
        saleFactory.deployTicketSale(ticketsAddr, false, startTime, endTime);
    }

    function test_deployTicketSale_unknownEventTicketsReverts() public {
        vm.prank(brand);
        vm.expectRevert(SaleFactory.SaleFactoryOnlyBrand.selector);
        saleFactory.deployTicketSale(makeAddr("random1155"), false, startTime, endTime);
    }
}
