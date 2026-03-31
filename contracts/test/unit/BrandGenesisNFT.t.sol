// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {BrandGenesisNFT} from "../../src/brand/BrandGenesisNFT.sol";
import {ManaRoles} from "../../src/constants/ManaRoles.sol";

contract BrandGenesisNFTTest is Test {
    BrandGenesisNFT public nft;

    address public admin = makeAddr("admin");
    address public minter = makeAddr("minter");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    function setUp() public {
        BrandGenesisNFT impl = new BrandGenesisNFT();
        bytes memory data = abi.encodeCall(BrandGenesisNFT.initialize, ("Brand Genesis", "BGN", admin));
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), data);
        nft = BrandGenesisNFT(address(proxy));

        // Grant MINTER_ROLE to minter
        vm.prank(admin);
        nft.grantRole(ManaRoles.getMinterRole(), minter);
    }

    // ─── initialize ───────────────────────────────────────────────

    function test_initialize_setsRoles() public view {
        assertTrue(nft.hasRole(ManaRoles.getDefaultAdminRole(), admin));
        assertTrue(nft.hasRole(ManaRoles.getMinterRole(), admin));
    }

    function test_initialize_revertZeroAddress() public {
        BrandGenesisNFT impl = new BrandGenesisNFT();
        bytes memory data = abi.encodeCall(BrandGenesisNFT.initialize, ("Brand Genesis", "BGN", address(0)));
        vm.expectRevert(BrandGenesisNFT.BrandGenesisNFTZeroAddress.selector);
        new ERC1967Proxy(address(impl), data);
    }

    // ─── mint ─────────────────────────────────────────────────────

    function test_mint_onlyMinterRole() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.mint(alice, 1, "", "");
    }

    function test_mint_assignsOwner() public {
        vm.prank(minter);
        nft.mint(alice, 1, "ipfs://meta", "https://img.png");
        assertEq(nft.ownerOf(1), alice);
    }

    function test_mint_setsTokenURI() public {
        vm.prank(minter);
        nft.mint(alice, 1, "ipfs://meta", "");
        assertEq(nft.tokenURI(1), "ipfs://meta");
    }

    function test_mint_setsImageURI() public {
        vm.prank(minter);
        nft.mint(alice, 1, "", "https://img.png");
        assertEq(nft.tokenImageURI(1), "https://img.png");
    }

    function test_mint_emitsEvent() public {
        vm.prank(minter);
        vm.expectEmit(true, true, false, true);
        emit BrandGenesisNFT.GenesisMinted(alice, 1, "ipfs://meta", "https://img.png");
        nft.mint(alice, 1, "ipfs://meta", "https://img.png");
    }

    function test_mint_duplicateTokenId_reverts() public {
        vm.startPrank(minter);
        nft.mint(alice, 1, "", "");
        vm.expectRevert();
        nft.mint(bob, 1, "", "");
        vm.stopPrank();
    }

    // ─── safeMint ─────────────────────────────────────────────────

    function test_safeMint_onlyMinterRole() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.safeMint(alice, 2, "", "");
    }

    function test_safeMint_assignsOwner() public {
        vm.prank(minter);
        nft.safeMint(alice, 2, "", "");
        assertEq(nft.ownerOf(2), alice);
    }

    // ─── setTokenImageURI ─────────────────────────────────────────

    function test_setTokenImageURI_onlyMinter() public {
        vm.prank(minter);
        nft.mint(alice, 1, "", "");

        vm.prank(alice);
        vm.expectRevert();
        nft.setTokenImageURI(1, "https://new.png");

        vm.prank(minter);
        nft.setTokenImageURI(1, "https://new.png");
        assertEq(nft.tokenImageURI(1), "https://new.png");
    }

    // ─── UUPS Upgrade ─────────────────────────────────────────────

    function test_upgrade_onlyDefaultAdmin() public {
        BrandGenesisNFT newImpl = new BrandGenesisNFT();

        vm.prank(alice);
        vm.expectRevert();
        nft.upgradeToAndCall(address(newImpl), "");

        vm.prank(admin);
        nft.upgradeToAndCall(address(newImpl), "");
    }

    // ─── supportsInterface ────────────────────────────────────────

    function test_supportsInterface_ERC721() public view {
        assertTrue(nft.supportsInterface(0x80ac58cd)); // ERC721
    }
}
