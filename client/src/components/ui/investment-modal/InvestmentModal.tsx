"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { formatUnits, parseUnits, type Address } from "viem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Brand } from "@/components/ui/brand-swipe";
import { toast } from "@/lib/toast";
import PinataService from "@/services/pinata.service";
import { useTokenByBrand, useTokenBalance } from "@/hooks/api/useTokens";
import { useBuyTokens, FAUCET_MINT_AMOUNT } from "@/hooks/web3/useBuyTokens";
import { useClaimRefund } from "@/hooks/web3/useClaimRefund";
import {
  getTokensControllerBalanceQueryKey,
  getTokensControllerMyPortfolioQueryKey,
  getTokensControllerMyTransactionsQueryKey,
  getTokensControllerHoldersQueryKey,
} from "@/api/generated/endpoints/tokens/tokens";

const SUPPORT_TOKEN_DECIMALS = 18;

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: Brand | null;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 30000;

export function InvestmentModal({ isOpen, onClose, brand }: InvestmentModalProps) {
  const t = useTranslations("investment");
  const queryClient = useQueryClient();
  const { data: token } = useTokenByBrand(brand?.id, { enabled: isOpen && !!brand });
  const sale = token?.sale;
  const isSaleOpen = sale?.status === "open";
  const isSaleCancelled = sale?.status === "cancelled_by_admin" || sale?.status === "cancelled_by_brand";

  const [amount, setAmount] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
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

  const {
    boughtOf,
    needsApproval: refundNeedsApproval,
    approve: approveRefund,
    approveStatus: refundApproveStatus,
    claim: claimRefund,
    claimStatus: refundClaimStatus,
    claimError: refundClaimError,
  } = useClaimRefund(
    sale?.escrowAddress as Address | undefined,
    token?.supportTokenAddress as Address | undefined,
  );

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
        title: t("supportConfirmedTitle"),
        description: t("supportConfirmedMessage", {
          symbol: brand?.tokenSymbol ?? t("tokensFallback"),
          brandName: brand?.name ?? "",
        }),
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

  useEffect(() => {
    if (refundClaimStatus !== "confirmed" || !token) return;
    void (async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getTokensControllerMyPortfolioQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getTokensControllerMyTransactionsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getTokensControllerBalanceQueryKey(token.id) }),
        queryClient.invalidateQueries({ queryKey: getTokensControllerHoldersQueryKey(token.id) }),
      ]);
      toast({
        title: t("refundSubmittedTitle"),
        description: t("refundSubmittedMessage"),
        variant: "success",
      });
      onClose();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refundClaimStatus]);

  if (!brand) return null;

  const handleClose = () => {
    if (isSyncing) return; // laisser le polling se terminer proprement
    setAmount("");
    setRefundAmount("");
    onClose();
  };

  const handleApproveOrBuy = async () => {
    if (!amount.trim()) {
      toast({ title: t("enterAmountTitle"), description: t("enterAmountTokensMessage"), variant: "error" });
      return;
    }
    if (needsApproval(amount)) {
      await approve(amount);
      return;
    }
    await buy(amount);
  };

  const refundAmountRaw = (() => {
    try {
      return refundAmount.trim() ? parseUnits(refundAmount.trim(), SUPPORT_TOKEN_DECIMALS) : null;
    } catch {
      return null;
    }
  })();
  const mustApproveRefund = refundAmountRaw != null ? refundNeedsApproval(refundAmountRaw) : false;
  const isRefundBusy =
    refundApproveStatus === "signing" || refundApproveStatus === "pending" ||
    refundClaimStatus === "signing" || refundClaimStatus === "pending";

  const handleApproveOrClaimRefund = async () => {
    if (refundAmountRaw == null || refundAmountRaw <= BigInt(0)) {
      toast({ title: t("enterAmountTitle"), description: t("enterAmountRefundMessage"), variant: "error" });
      return;
    }
    if (refundAmountRaw > boughtOf) {
      toast({ title: t("amountTooHighTitle"), description: t("amountTooHighMessage"), variant: "error" });
      return;
    }
    if (mustApproveRefund) {
      await approveRefund(refundAmountRaw);
      return;
    }
    await claimRefund(refundAmountRaw);
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
          <DialogTitle className="text-2xl font-bold">{t("title", { brandName: brand.name })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
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
                  <span className="text-sm text-muted-foreground">{t("tokenSymbol")}</span>
                  <span className="font-semibold">{token.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("yourUsdcBalance")}</span>
                  <span className="font-semibold">{usdcBalanceFormatted} USDC</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">{t("howManyTokens")}</label>
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
                    {t("estimatedCost", { amount: (Number(cost) / 1e6).toFixed(2) })}
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
                  ? t("requestingFaucet")
                  : t("needFaucet", { amount: FAUCET_MINT_AMOUNT })}
              </button>
            </>
          ) : isSaleCancelled && token && sale ? (
            <>
              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("tokenSymbol")}</span>
                  <span className="font-semibold">{token.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("refundable")}</span>
                  <span className="font-semibold">
                    {formatUnits(boughtOf, SUPPORT_TOKEN_DECIMALS)} {token.symbol}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("saleCancelledMessage")}
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium block">{t("howManyToRefund")}</label>
                <Input
                  type="number"
                  min="0"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={formatUnits(boughtOf, SUPPORT_TOKEN_DECIMALS)}
                  disabled={isRefundBusy}
                />
              </div>
            </>
          ) : (
            <div className="bg-accent/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {t("noSaleYet")}
              </p>
              <p className="text-xs text-muted-foreground">{t("checkBackSoon")}</p>
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
                  ? t("syncingLabel")
                  : buyStatus === "signing" || buyStatus === "pending"
                    ? t("confirmingPurchase")
                    : approveStatus === "signing" || approveStatus === "pending"
                      ? t("confirmingApproval")
                      : mustApprove
                        ? t("approveUsdc")
                        : t("supportBrand")}
              </Button>
            ) : isSaleCancelled ? (
              <Button
                onClick={() => void handleApproveOrClaimRefund()}
                disabled={isRefundBusy}
                className="w-full bg-linear-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                size="lg"
              >
                {refundClaimStatus === "signing" || refundClaimStatus === "pending"
                  ? t("confirmingRefund")
                  : refundApproveStatus === "signing" || refundApproveStatus === "pending"
                    ? t("confirmingApproval")
                    : mustApproveRefund
                      ? t("approveTokens")
                      : t("claimRefund")}
              </Button>
            ) : (
              <Button
                onClick={handleClose}
                className="w-full bg-linear-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
                size="lg"
                disabled
              >
                {t("noBadgeAvailable")}
              </Button>
            )}
            <Button onClick={handleClose} variant="ghost" className="w-full" disabled={isSyncing}>
              {isSaleOpen ? t("later") : t("close")}
            </Button>
          </div>
          {refundClaimError && refundClaimStatus === "failed" && (
            <p className="text-sm text-destructive">{refundClaimError.message}</p>
          )}
          {buyError && buyStatus === "failed" && (
            <p className="text-sm text-destructive">{buyError.message}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
