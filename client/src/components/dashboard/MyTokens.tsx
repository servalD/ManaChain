"use client";

import { formatUnits } from "viem";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyPortfolio } from "@/hooks/api/useTokens";

function priceOf(sale: { pricePerToken: string } | null | undefined, fallback: string): number {
  if (sale) return Number(formatUnits(BigInt(sale.pricePerToken), 6));
  return Number(fallback);
}

export function MyTokens() {
  const { data: portfolio, isLoading } = useMyPortfolio();
  const entries = portfolio ?? [];

  const totalValue = entries.reduce(
    (sum, entry) => sum + entry.balance * priceOf(entry.token.sale, entry.token.currentPrice),
    0,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No badges yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start supporting brands to see your badges here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">My Badges Units</h2>
          <p className="text-sm text-muted-foreground">
            Total Support Value (reference, not a market price):{" "}
            <span className="font-semibold text-foreground">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Badge</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">My Holdings</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Value (base)</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const { token, balance } = entry;
                const price = priceOf(token.sale, token.currentPrice);
                const value = balance * price;
                const sharePct = token.totalSupply > 0 ? (balance / token.totalSupply) * 100 : 0;
                return (
                  <tr
                    key={token.id}
                    className={`border-b border-border hover:bg-muted/20 transition-colors ${
                      index === entries.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-violet-400">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{token.symbol}</div>
                          <div className="text-xs text-muted-foreground">
                            {sharePct >= 0.5 ? "High" : sharePct >= 0.05 ? "Medium" : "Low"} support level
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold text-sm">
                        {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} units
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {token.totalSupply > 0 ? `${sharePct.toFixed(3)}% of total supply` : "—"}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold text-sm">
                        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {balance > 0 ? `$${price.toFixed(2)} / unit` : "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                          <MoreHorizontal className="h-3 w-3 mr-1" />
                          More Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
