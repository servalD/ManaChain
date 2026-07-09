"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brand } from "@/components/ui/brand-swipe";
import { toast } from "@/lib/toast";
import PinataService from "@/services/pinata.service";
import { useTokenByBrand, useTokenBalance } from "@/hooks/api/useTokens";
import { useBuyTokens, FAUCET_MINT_AMOUNT } from "@/hooks/web3/useBuyTokens";
import {
  getTokensControllerBalanceQueryKey,
  getTokensControllerMyPortfolioQueryKey,
  getTokensControllerMyTransactionsQueryKey,
  getTokensControllerHoldersQueryKey,
} from "@/api/generated/endpoints/tokens/tokens";

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

export function InvestmentModal({ isOpen, onClose, brand }: InvestmentModalProps) {
  const queryClient = useQueryClient();
  const { data: token } = useTokenByBrand(brand?.id, { enabled: isOpen && !!brand });
  const sale = token?.sale;
  const isSaleOpen = sale?.status === "open";

  const [amount, setAmount] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const preBuyBalanceRef = useRef<number | undefined>(undefined);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: balanceData } = useTokenBalance(token?.id, { enabled: isOpen && !!token });

  const {
    usdcBalanceFormatted,
    estimateCost,
    needsApproval,
    approve,
    approveStatus,
    buy,
    buyStatus,
    buyError,
    mintFaucet,
    faucetStatus,
  } = useBuyTokens(sale?.escrowAddress as `0x${string}` | undefined, sale?.pricePerToken);

  const stopPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (pollDeadlineRef.current) clearTimeout(pollDeadlineRef.current);
    pollTimerRef.current = null;
    pollDeadlineRef.current = null;
  };

  useEffect(() => stopPolling, []);

  useEffect(() => {
    if (buyStatus !== "confirmed" || !token) return;
    preBuyBalanceRef.current = balanceData?.balance;
    setIsSyncing(true);

    const finish = async () => {
      stopPolling();
      setIsSyncing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getTokensControllerMyPortfolioQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getTokensControllerMyTransactionsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getTokensControllerHoldersQueryKey(token.id) }),
      ]);
      toast({
        title: "Support confirmed",
        description: `You now hold ${brand?.tokenSymbol ?? "tokens"} from ${brand?.name}.`,
        variant: "success",
      });
      onClose();
    };

    pollTimerRef.current = setInterval(async () => {
      await queryClient.refetchQueries({ queryKey: getTokensControllerBalanceQueryKey(token.id) });
      const latest = queryClient.getQueryData<{ balance: number }>(
        getTokensControllerBalanceQueryKey(token.id),
      );
      if (latest && latest.balance !== preBuyBalanceRef.current) {
        void finish();
      }
    }, POLL_INTERVAL_MS);

    pollDeadlineRef.current = setTimeout(() => {
      void finish(); // timeout non bloquant : l'indexer rattrapera de toute façon.
    }, POLL_TIMEOUT_MS);

    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyStatus]);

  if (!brand) return null;

  const handleClose = () => {
    if (isSyncing) return; // laisser le polling se terminer proprement
    setAmount("");
    onClose();
  };

  const handleApproveOrBuy = async () => {
    if (!amount.trim()) {
      toast({ title: "Enter an amount", description: "How many tokens would you like?", variant: "error" });
      return;
    }
    if (needsApproval(amount)) {
      await approve(amount);
      return;
    }
    await buy(amount);
  };

  const cost = estimateCost(amount);
  const isBusy =
    approveStatus === "signing" || approveStatus === "pending" ||
    buyStatus === "signing" || buyStatus === "pending" || isSyncing;
  const mustApprove = amount.trim() ? needsApproval(amount) : false;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Support {brand.name}</DialogTitle>
          <DialogDescription>
            You&apos;ve liked this brand! Show your support with a community badge — this is not
            an investment: no financial return is promised and badges do not represent a share of
            the brand&apos;s capital.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Brand Info */}
          <div className="flex items-start gap-4">
            {brand.logo && (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                <img
                  src={PinataService.normalizeIpfsUrl(brand.logo)}
                  alt={brand.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{brand.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{brand.industry}</p>
              <p className="text-sm text-foreground/80 line-clamp-3">{brand.description}</p>
            </div>
          </div>

          {isSaleOpen && token && sale ? (
            <>
              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Token Symbol</span>
                  <span className="font-semibold">{token.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your USDC balance</span>
                  <span className="font-semibold">{usdcBalanceFormatted} USDC</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">How many tokens?</label>
                <Input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10"
                  disabled={isBusy}
                />
                {cost != null && (
                  <p className="text-xs text-muted-foreground">
                    Estimated cost: {(Number(cost) / 1e6).toFixed(2)} USDC
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void mintFaucet()}
                disabled={faucetStatus === "signing" || faucetStatus === "pending"}
                className="text-xs text-violet-500 hover:underline disabled:opacity-50"
              >
                {faucetStatus === "signing" || faucetStatus === "pending"
                  ? "Requesting test USDC…"
                  : `Need test USDC? Get ${FAUCET_MINT_AMOUNT} from the faucet`}
              </button>
            </>
          ) : (
            <div className="bg-accent/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                This brand hasn&apos;t opened a token sale yet
              </p>
              <p className="text-xs text-muted-foreground">Check back soon!</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            {isSaleOpen ? (
              <Button
                onClick={handleApproveOrBuy}
                disabled={isBusy}
                className="w-full bg-linear-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                size="lg"
              >
                {isSyncing
                  ? "Confirmed on-chain — syncing…"
                  : buyStatus === "signing" || buyStatus === "pending"
                    ? "Confirming purchase…"
                    : approveStatus === "signing" || approveStatus === "pending"
                      ? "Confirming approval…"
                      : mustApprove
                        ? "Approve USDC"
                        : "Support this Brand"}
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="w-full bg-linear-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                size="lg"
                disabled
              >
                No Badge Available Yet
              </Button>
            )}
            <Button onClick={handleClose} variant="ghost" className="w-full" disabled={isSyncing}>
              {isSaleOpen ? "Later" : "Close"}
            </Button>
          </div>
          {buyError && buyStatus === "failed" && (
            <p className="text-sm text-destructive">{buyError.message}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
