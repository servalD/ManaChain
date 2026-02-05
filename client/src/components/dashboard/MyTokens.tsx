"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Token {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  value: number;
  logo?: string;
  totalSupply: number;
}

// Mock tokens data
const mockTokens: Token[] = [
  {
    id: "1",
    symbol: "NIKE",
    name: "Nike Badge",
    amount: 150,
    value: 1250.75,
    logo: "/Logo_NIKE.svg",
    totalSupply: 100000,
  },
  {
    id: "2",
    symbol: "BMW",
    name: "BMW Badge",
    amount: 80,
    value: 890.5,
    logo: "/BMW_logo_(gray).svg",
    totalSupply: 50000,
  },
  {
    id: "3",
    symbol: "LVMH",
    name: "LVMH Badge",
    amount: 45.0,
    value: 675.0,
    logo: "/LVMH_wordmark.svg",
    totalSupply: 75000,
  },
];

export function MyTokens() {
  const [tokens] = useState<Token[]>(mockTokens);
  
  const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

  if (tokens.length === 0) {
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
            Total Support Value:{" "}
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
              {tokens.map((token, index) => {
                const sharePct = token.totalSupply > 0 ? (token.amount / token.totalSupply) * 100 : 0;
                const supportLevel = sharePct >= 0.5 ? "High" : sharePct >= 0.05 ? "Medium" : "Low";
                return (
                  <tr
                    key={token.id}
                    className={`border-b border-border hover:bg-muted/20 transition-colors ${
                      index === tokens.length - 1 ? "border-b-0" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {token.logo ? (
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-border overflow-hidden">
                            <img
                              src={token.logo}
                              alt={token.name}
                              className="w-full h-full object-contain p-1"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  target.style.display = 'none';
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center';
                                  placeholder.textContent = token.symbol.charAt(0);
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-violet-400">
                              {token.symbol.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{token.symbol}</div>
                          <div className="text-xs text-muted-foreground">{token.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold text-sm">
                        {token.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} units
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {token.totalSupply > 0
                          ? `${((token.amount / token.totalSupply) * 100).toFixed(3)}% of total supply`
                          : "—"}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold text-sm">
                        ${token.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {token.amount > 0
                          ? `$${(token.value / token.amount).toFixed(2)} / unit`
                          : "—"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                        >
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
