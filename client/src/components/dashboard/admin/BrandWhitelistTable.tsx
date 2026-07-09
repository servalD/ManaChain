"use client";

import { useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBrandsForWhitelist } from "@/hooks/api/useBrands";
import { useTxFlow } from "@/hooks/web3/useTxFlow";
import { manaAdminAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";
import { toast } from "@/lib/toast";
import type { BrandResponse } from "@/api/generated/models";

interface RowProps {
  brand: BrandResponse;
  ownerBlockchainAddress: string | null;
  isLast: boolean;
}

function BrandWhitelistRow({ brand, ownerBlockchainAddress, isLast }: RowProps) {
  const address = ownerBlockchainAddress as `0x${string}` | undefined;

  const {
    data: isWhitelisted,
    isLoading: isStatusLoading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.manaAdmin,
    abi: manaAdminAbi,
    functionName: "isBrandWhitelisted",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { status, write } = useTxFlow({
    abi: manaAdminAbi,
    address: CONTRACT_ADDRESSES.manaAdmin,
    onConfirmed: async () => {
      await refetch();
      toast({
        title: "Whitelist updated",
        description: `${brand.name} is now ${isWhitelisted ? "removed from the whitelist" : "whitelisted"}.`,
        variant: "success",
      });
    },
  });

  const isBusy = status === "signing" || status === "pending";

  const toggle = () => {
    if (!address) return;
    void write("setBrandWhitelisted", [address, !isWhitelisted]);
  };

  return (
    <tr className={cn("border-b border-border hover:bg-muted/20 transition-colors", isLast && "border-b-0")}>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-violet-400">{brand.name.charAt(0)}</span>
          </div>
          <div>
            <div className="font-semibold text-sm">{brand.name}</div>
            <div className="text-xs text-muted-foreground">{brand.country}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className="font-mono text-xs text-muted-foreground">
          {address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "No wallet linked"}
        </span>
      </td>
      <td className="p-4">
        {!address ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : isStatusLoading ? (
          <span className="text-xs text-muted-foreground">Checking…</span>
        ) : (
          <Badge variant={isWhitelisted ? "default" : "outline"}>
            {isWhitelisted ? "Whitelisted" : "Not whitelisted"}
          </Badge>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant={isWhitelisted ? "outline" : "default"}
            disabled={!address || isBusy}
            onClick={toggle}
          >
            {isBusy ? "Confirming…" : isWhitelisted ? "Remove" : "Whitelist on-chain"}
          </Button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Table admin des marques + statut de whitelist on-chain (`ManaAdmin`). Le
 * bouton signe `setBrandWhitelisted` avec le wallet connecté — doit être le
 * wallet operator, sinon la tx revert on-chain (comportement attendu, pas
 * vérifié côté front).
 */
export function BrandWhitelistTable() {
  const { data, isLoading } = useBrandsForWhitelist({ limit: 100, offset: 0 });
  const entries = data?.brands ?? [];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Brand</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Owner wallet</th>
              <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Status</th>
              <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                  </div>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  No brands found
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <BrandWhitelistRow
                  key={entry.brand.id}
                  brand={entry.brand}
                  ownerBlockchainAddress={entry.ownerBlockchainAddress}
                  isLast={index === entries.length - 1}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
