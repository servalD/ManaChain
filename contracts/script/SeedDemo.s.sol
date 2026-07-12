// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import {console} from "forge-std/Script.sol";
import {stdJson} from "forge-std/StdJson.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {ManaAdmin} from "../src/access/ManaAdmin.sol";
import {BrandGenesisNFT} from "../src/brand/BrandGenesisNFT.sol";
import {FractionalVault} from "../src/brand/FractionalVault.sol";
import {BrandFactory} from "../src/factory/BrandFactory.sol";
import {EventFactory} from "../src/factory/EventFactory.sol";
import {SaleFactory} from "../src/factory/SaleFactory.sol";
import {EventTickets} from "../src/events/EventTickets.sol";
import {TicketSale} from "../src/events/TicketSale.sol";
import {TokenSaleEscrow} from "../src/brand/TokenSaleEscrow.sol";
import {ISaleFactory} from "../src/interfaces/ISaleFactory.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {DeployConfig} from "./helpers/DeployConfig.sol";

/**
 * @notice Peuple un environnement déjà déployé (via DeployAll) avec des brands, events et
 *         achats clients de démo. Ne redéploie PAS l'infra plateforme (ManaAdmin, factories,
 *         MockUSDC) — elle est lue depuis `config/deploy.json` → `.deployed.*`.
 *
 * Contrairement à DeployAll (un seul broadcaster jouant tous les rôles), ce script diffuse
 * chaque étape avec la clé privée réelle de l'acteur concerné (opérateur ManaAdmin, chaque
 * brand, chaque client) — cf. `config/demo-seed.json` pour la liste déclarative des entités
 * et les noms des variables d'env contenant leurs clés privées.
 *
 * `.ticketPurchases[].eventIndex` est un index GLOBAL et PLAT sur tous les events de tous
 * les brands, dans l'ordre d'apparition de `brands[].events[]` (brand0.event0 = 0,
 * brand1.event0 = 1, etc.) — pas un index relatif au brand.
 *
 * Lit :   config/deploy.json → .deployed.* (infra existante)
 *         config/demo-seed.json → entités à créer
 * Écrit : config/demo-seed.output.json → adresses déployées par brand/event (clé plate)
 *
 * Run (local) :
 *   forge script script/SeedDemo.s.sol --rpc-url http://localhost:8545 --broadcast -vvvv
 * Run (Fuji) :
 *   forge script script/SeedDemo.s.sol --rpc-url fuji --broadcast -vvvv
 */
contract SeedDemo is DeployConfig {
    using stdJson for string;

    string internal constant DEMO_CONFIG_PATH = "config/demo-seed.json";
    string internal constant DEMO_OUTPUT_PATH = "config/demo-seed.output.json";

    function run() external {
        string memory demo = vm.readFile(DEMO_CONFIG_PATH);

        // vm.writeJson patches an EXISTING file; bootstrap it on first run.
        if (!vm.exists(DEMO_OUTPUT_PATH)) {
            vm.writeFile(DEMO_OUTPUT_PATH, "{}");
        }

        // ── Infra existante (déployée par DeployAll) ───────────────────
        ManaAdmin manaAdmin = ManaAdmin(readDeployed("manaAdminProxy"));
        BrandFactory brandFactory = BrandFactory(readDeployed("brandFactory"));
        EventFactory eventFactory = EventFactory(readDeployed("eventFactory"));
        SaleFactory saleFactory = SaleFactory(readDeployed("saleFactory"));
        MockUSDC usdc = MockUSDC(readDeployed("mockUSDC"));

        uint256 operatorPk = vm.envUint(demo.readString(".admin.operatorPrivateKeyEnv"));

        uint256 brandCount = demo.readUint(".brandCount");
        address[] memory brandAddrs = new address[](brandCount);
        address[] memory tokenSaleEscrows = new address[](brandCount);

        // Adresses de vente de tickets, indexées par index GLOBAL d'event (voir docblock).
        uint256 totalEvents = _countTotalEvents(demo, brandCount);
        address[] memory ticketSales = new address[](totalEvents);
        uint256 eventCursor = 0;

        // ── 1. Whitelist tous les brands (clé opérateur) ───────────────
        vm.startBroadcast(operatorPk);
        for (uint256 i = 0; i < brandCount; i++) {
            address brandAddr = vm.addr(vm.envUint(demo.readString(_brandPath(i, "privateKeyEnv"))));
            brandAddrs[i] = brandAddr;
            manaAdmin.setBrandWhitelisted(brandAddr, true);
        }
        vm.stopBroadcast();

        // ── 2. Déploiement du module de chaque brand (clé du brand) ────
        for (uint256 i = 0; i < brandCount; i++) {
            uint256 brandPk = vm.envUint(demo.readString(_brandPath(i, "privateKeyEnv")));
            vm.startBroadcast(brandPk);

            (address genesisNFT, address vault, address supportToken) = brandFactory.deployBrandModule(
                brandAddrs[i],
                demo.readString(_brandPath(i, "nftName")),
                demo.readString(_brandPath(i, "nftSymbol")),
                demo.readString(_brandPath(i, "tokenName")),
                demo.readString(_brandPath(i, "tokenSymbol")),
                demo.readString(_brandPath(i, "tokenImageUri")),
                vm.parseUint(demo.readString(_brandPath(i, "totalSupplyCap")))
            );

            BrandGenesisNFT(genesisNFT).mint(
                brandAddrs[i], 1, demo.readString(_brandPath(i, "genesisUri")), demo.readString(_brandPath(i, "tokenImageUri"))
            );
            BrandGenesisNFT(genesisNFT).approve(vault, 1);
            FractionalVault(vault).depositGenesis(IERC721(genesisNFT), 1);

            address escrow = FractionalVault(vault).openSale(
                ISaleFactory(address(saleFactory)),
                vm.parseUint(demo.readString(_brandPath(i, "tokenSale.pricePerToken"))),
                vm.parseUint(demo.readString(_brandPath(i, "tokenSale.totalForSale"))),
                demo.readUint(_brandPath(i, "tokenSale.startTime")),
                demo.readUint(_brandPath(i, "tokenSale.endTime"))
            );
            tokenSaleEscrows[i] = escrow;

            uint256 eventCount = demo.readUint(_brandPath(i, "eventCount"));
            for (uint256 e = 0; e < eventCount; e++) {
                string memory evPath = _eventPath(i, e, "");
                address eventTickets = eventFactory.deployEventModule(
                    brandAddrs[i], demo.readString(_eventPath(i, e, "uri"))
                );
                address ticketSale = saleFactory.deployTicketSale(
                    eventTickets,
                    demo.readBool(_eventPath(i, e, "freeEvent")),
                    demo.readUint(_eventPath(i, e, "startTime")),
                    demo.readUint(_eventPath(i, e, "endTime"))
                );

                uint256 ticketTypeCount = demo.readUint(_eventPath(i, e, "ticketTypeCount"));
                for (uint256 t = 0; t < ticketTypeCount; t++) {
                    string memory ttPath = string.concat(evPath, ".ticketTypes[", vm.toString(t), "]");
                    uint256 tokenId = demo.readUint(string.concat(ttPath, ".tokenId"));
                    uint256 supply = demo.readUint(string.concat(ttPath, ".supply"));
                    uint256 price = vm.parseUint(demo.readString(string.concat(ttPath, ".price")));

                    EventTickets(eventTickets).mint(ticketSale, tokenId, supply);
                    TicketSale(ticketSale).setPrice(tokenId, price);
                }

                ticketSales[eventCursor] = ticketSale;
                writeDemoOutput(string.concat("brand", vm.toString(i), "_event", vm.toString(e), "_eventTickets"), eventTickets);
                writeDemoOutput(string.concat("brand", vm.toString(i), "_event", vm.toString(e), "_ticketSale"), ticketSale);
                eventCursor++;
            }

            vm.stopBroadcast();

            writeDemoOutput(string.concat("brand", vm.toString(i), "_addr"), brandAddrs[i]);
            writeDemoOutput(string.concat("brand", vm.toString(i), "_genesisNFT"), genesisNFT);
            writeDemoOutput(string.concat("brand", vm.toString(i), "_vault"), vault);
            writeDemoOutput(string.concat("brand", vm.toString(i), "_supportToken"), supportToken);
            writeDemoOutput(string.concat("brand", vm.toString(i), "_tokenSaleEscrow"), escrow);

            console.log("Brand deployed:", demo.readString(_brandPath(i, "nftName")));
            console.log("  addr        :", brandAddrs[i]);
            console.log("  tokenSaleEscrow:", escrow);
        }

        // ── 3. Faucet + achats clients (clé de chaque client) ──────────
        uint256 clientCount = demo.readUint(".clientCount");
        for (uint256 c = 0; c < clientCount; c++) {
            uint256 clientPk = vm.envUint(demo.readString(_clientPath(c, "privateKeyEnv")));
            address clientAddr = vm.addr(clientPk);
            vm.startBroadcast(clientPk);

            uint256 faucetAmount = vm.parseUint(demo.readString(_clientPath(c, "usdcFaucetAmount")));
            usdc.mint(clientAddr, faucetAmount);

            uint256 purchaseCount = demo.readUint(_clientPath(c, "purchaseCount"));
            for (uint256 p = 0; p < purchaseCount; p++) {
                string memory purchasePath = string.concat(_clientPath(c, "purchases"), "[", vm.toString(p), "]");
                uint256 brandIndex = demo.readUint(string.concat(purchasePath, ".brandIndex"));
                uint256 tokenAmount = vm.parseUint(demo.readString(string.concat(purchasePath, ".tokenAmount")));

                address escrow = tokenSaleEscrows[brandIndex];
                IERC20(address(usdc)).approve(escrow, type(uint256).max);
                TokenSaleEscrow(escrow).buy(tokenAmount);
            }

            uint256 ticketPurchaseCount = demo.readUint(_clientPath(c, "ticketPurchaseCount"));
            for (uint256 tp = 0; tp < ticketPurchaseCount; tp++) {
                string memory tpPath = string.concat(_clientPath(c, "ticketPurchases"), "[", vm.toString(tp), "]");
                uint256 eventIndex = demo.readUint(string.concat(tpPath, ".eventIndex"));
                uint256 ticketTypeIndex = demo.readUint(string.concat(tpPath, ".ticketTypeIndex"));
                uint256 quantity = demo.readUint(string.concat(tpPath, ".quantity"));

                address ticketSale = ticketSales[eventIndex];
                IERC20(address(usdc)).approve(ticketSale, type(uint256).max);
                TicketSale(ticketSale).buy(ticketTypeIndex, quantity);
            }

            vm.stopBroadcast();
            console.log("Client seeded:", clientAddr);
        }

        console.log("=== SeedDemo done ===");
        console.log("Brands seeded: ", brandCount);
        console.log("Clients seeded:", clientCount);
        console.log("Addresses saved to config/demo-seed.output.json");
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    function _brandPath(uint256 i, string memory field) private pure returns (string memory) {
        return string.concat(".brands[", vm.toString(i), "].", field);
    }

    function _eventPath(uint256 i, uint256 e, string memory field) private pure returns (string memory) {
        string memory base = string.concat(".brands[", vm.toString(i), "].events[", vm.toString(e), "]");
        if (bytes(field).length == 0) return base;
        return string.concat(base, ".", field);
    }

    function _clientPath(uint256 c, string memory field) private pure returns (string memory) {
        return string.concat(".clients[", vm.toString(c), "].", field);
    }

    function _countTotalEvents(string memory demo, uint256 brandCount) private pure returns (uint256 total) {
        for (uint256 i = 0; i < brandCount; i++) {
            total += demo.readUint(_brandPath(i, "eventCount"));
        }
    }

    /// @dev Écrit dans `config/demo-seed.output.json` sous une clé plate (pas de tableaux imbriqués).
    function writeDemoOutput(string memory key, address addr) internal {
        vm.writeJson(string.concat('"', vm.toString(addr), '"'), DEMO_OUTPUT_PATH, string.concat(".", key));
    }
}
