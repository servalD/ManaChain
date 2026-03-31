// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {FractionalVault} from "../../src/brand/FractionalVault.sol";
import {BrandSupportToken} from "../../src/brand/BrandSupportToken.sol";
import {BrandGenesisNFT} from "../../src/brand/BrandGenesisNFT.sol";

contract FractionalVaultTest is Test {
    FractionalVault public vault;
    BrandSupportToken public token;
    BrandGenesisNFT public nft;

    address public brandOwner = makeAddr("brandOwner");
    address public alice = makeAddr("alice");
    address public escrow = makeAddr("escrow");

    function setUp() public {
        // Deploy vault
        FractionalVault vaultImpl = new FractionalVault();
        bytes memory vaultData = abi.encodeCall(FractionalVault.initialize, (brandOwner));
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultData);
        vault = FractionalVault(address(vaultProxy));

        // Deploy support token (vault as minter)
        BrandSupportToken tokenImpl = new BrandSupportToken();
        bytes memory tokenData = abi.encodeCall(
            BrandSupportToken.initialize,
            ("Brand Support", "BST", address(vault), "", 1_000_000e18)
        );
        ERC1967Proxy tokenProxy = new ERC1967Proxy(address(tokenImpl), tokenData);
        token = BrandSupportToken(address(tokenProxy));

        // Link token to vault
        vm.prank(brandOwner);
        vault.setSupportToken(token);

        // Deploy genesis NFT
        BrandGenesisNFT nftImpl = new BrandGenesisNFT();
        bytes memory nftData = abi.encodeCall(BrandGenesisNFT.initialize, ("Brand NFT", "BNFT", brandOwner));
        ERC1967Proxy nftProxy = new ERC1967Proxy(address(nftImpl), nftData);
        nft = BrandGenesisNFT(address(nftProxy));

        // Mint NFT to brandOwner
        vm.prank(brandOwner);
        nft.mint(brandOwner, 1, "", "");
    }

    // ─── setSupportToken ──────────────────────────────────────────

    function test_setSupportToken_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setSupportToken(token);
    }

    function test_setSupportToken_cannotSetTwice() public {
        vm.prank(brandOwner);
        vm.expectRevert(FractionalVault.FractionalVaultTokenAlreadySet.selector);
        vault.setSupportToken(token);
    }

    // ─── depositGenesis ───────────────────────────────────────────

    function test_depositGenesis_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.depositGenesis(nft, 1);
    }

    function test_depositGenesis_transfersNFT() public {
        vm.startPrank(brandOwner);
        nft.approve(address(vault), 1);
        vault.depositGenesis(nft, 1);
        vm.stopPrank();

        assertEq(nft.ownerOf(1), address(vault));
        (address nftAddr, uint256 tokenId) = vault.getGenesisNFT();
        assertEq(nftAddr, address(nft));
        assertEq(tokenId, 1);
    }

    function test_depositGenesis_cannotDepositTwice() public {
        vm.startPrank(brandOwner);
        nft.approve(address(vault), 1);
        vault.depositGenesis(nft, 1);

        // Mint another NFT and try to deposit again
        nft.mint(brandOwner, 2, "", "");
        nft.approve(address(vault), 2);
        vm.expectRevert(FractionalVault.FractionalVaultNFTAlreadyDeposited.selector);
        vault.depositGenesis(nft, 2);
        vm.stopPrank();
    }

    // ─── mintSupport ──────────────────────────────────────────────

    function test_mintSupport_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.mintSupport(alice, 100e18);
    }

    function test_mintSupport_mintsTokens() public {
        vm.prank(brandOwner);
        vault.mintSupport(alice, 500e18);
        assertEq(token.balanceOf(alice), 500e18);
    }

    function test_mintSupport_revertTokenNotSet() public {
        // Create a fresh vault without token set
        FractionalVault vaultImpl = new FractionalVault();
        bytes memory vaultData = abi.encodeCall(FractionalVault.initialize, (brandOwner));
        ERC1967Proxy vaultProxy = new ERC1967Proxy(address(vaultImpl), vaultData);
        FractionalVault freshVault = FractionalVault(address(vaultProxy));

        vm.prank(brandOwner);
        vm.expectRevert(FractionalVault.FractionalVaultTokenNotSet.selector);
        freshVault.mintSupport(alice, 100e18);
    }

    // ─── burnSupport ──────────────────────────────────────────────

    function test_burnSupport_onlyOwner() public {
        vm.prank(brandOwner);
        vault.mintSupport(alice, 100e18);

        vm.prank(alice);
        vm.expectRevert();
        vault.burnSupport(alice, 50e18);
    }

    /// @dev C-2 SECURITY: TDD Test — Must revert if no approval is given
    function test_burnSupport_withoutApproval() public {
        vm.prank(brandOwner);
        vault.mintSupport(alice, 100e18);

        // Owner burns alice's tokens without alice's approval -> MUST REVERT
        vm.prank(brandOwner);
        vm.expectRevert(); // Expect revert. Currently fails the test since contract is vulnerable!
        vault.burnSupport(alice, 100e18);
    }

    /// @dev Documenting standard functionality (even though approval isn't actually required yet)
    function test_burnSupport_withApproval() public {
        vm.prank(brandOwner);
        vault.mintSupport(alice, 100e18);

        vm.prank(alice);
        token.approve(address(vault), 100e18);

        vm.prank(brandOwner);
        vault.burnSupport(alice, 100e18);
        assertEq(token.balanceOf(alice), 0);
    }

    // ─── burnVaultBalance ─────────────────────────────────────────

    function test_burnVaultBalance_onlyOwnerOrEscrow() public {
        // Mint tokens to the vault itself
        vm.prank(brandOwner);
        vault.mintSupport(address(vault), 100e18);

        // Alice cannot call
        vm.prank(alice);
        vm.expectRevert(FractionalVault.FractionalVaultUnauthorized.selector);
        vault.burnVaultBalance(50e18);
    }

    function test_burnVaultBalance_byOwner() public {
        vm.prank(brandOwner);
        vault.mintSupport(address(vault), 100e18);

        vm.prank(brandOwner);
        vault.burnVaultBalance(100e18);
        assertEq(token.balanceOf(address(vault)), 0);
    }

    function test_burnVaultBalance_byEscrow() public {
        vm.prank(brandOwner);
        vault.setEscrow(escrow);

        vm.prank(brandOwner);
        vault.mintSupport(address(vault), 100e18);

        vm.prank(escrow);
        vault.burnVaultBalance(100e18);
        assertEq(token.balanceOf(address(vault)), 0);
    }

    function test_burnVaultBalance_revertInsufficientBalance() public {
        vm.prank(brandOwner);
        vm.expectRevert(FractionalVault.FractionalVaultInsufficientBalance.selector);
        vault.burnVaultBalance(1);
    }

    // ─── setEscrow ────────────────────────────────────────────────

    function test_setEscrow_onlyOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setEscrow(escrow);
    }

    function test_setEscrow_storesValue() public {
        vm.prank(brandOwner);
        vault.setEscrow(escrow);
        assertEq(vault.getEscrow(), escrow);
    }

    // ─── UUPS Upgrade ─────────────────────────────────────────────

    function test_upgrade_onlyOwner() public {
        FractionalVault newImpl = new FractionalVault();

        vm.prank(alice);
        vm.expectRevert();
        vault.upgradeToAndCall(address(newImpl), "");

        vm.prank(brandOwner);
        vault.upgradeToAndCall(address(newImpl), "");
    }
}
