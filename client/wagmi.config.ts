import { defineConfig } from "@wagmi/cli";
import { foundry } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "src/lib/web3/generated.ts",
  plugins: [
    foundry({
      project: "../contracts",
      include: [
        "ManaAdmin.json",
        "BrandFactory.json",
        "SaleFactory.json",
        "EventFactory.json",
        "FractionalVault.json",
        "BrandGenesisNFT.json",
        "BrandSupportToken.json",
        "TokenSaleEscrow.json",
        "EventTickets.json",
        "TicketSale.json",
        "MockUSDC.json",
      ],
    }),
  ],
});
