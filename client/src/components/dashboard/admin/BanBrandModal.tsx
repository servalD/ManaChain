"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Address } from "viem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBrandsForWhitelist } from "@/hooks/api/useBrands";
import { useTokenByBrand } from "@/hooks/api/useTokens";
import { useBanBrand } from "@/hooks/api/useBans";
import { useTxFlow } from "@/hooks/web3/useTxFlow";
import { manaAdminAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";
import { toast } from "@/lib/toast";
import type { BrandResponse } from "@/api/generated/models";

interface BanBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BrandOption {
  brand: BrandResponse;
  ownerBlockchainAddress: string | null;
}

type Step = "pick" | "blacklist-pending" | "cancel-pending" | "submitting";

export function BanBrandModal({ isOpen, onClose }: BanBrandModalProps) {
  const t = useTranslations("dashboard.admin.banBrandModal");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BrandOption | null>(null);
  const [reason, setReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<Step>("pick");

  const blacklistHashRef = useRef<string | null>(null);
  const cancelHashRef = useRef<string | null>(null);

  const { data } = useBrandsForWhitelist({ search: search || undefined, limit: 8, offset: 0 });
  const results = search.trim() && !selected ? (data?.brands ?? []) : [];

  const { data: token } = useTokenByBrand(selected?.brand.id, { enabled: !!selected });
  const hasOpenSale = token?.sale?.status === "open";
  const escrowAddress = token?.sale?.escrowAddress as Address | undefined;

  const banBrand = useBanBrand();

  const submitBan = async (brand: BrandOption) => {
    setStep("submitting");
    await banBrand.mutateAsync({
      id: brand.brand.id,
      data: {
        reason: reason.trim(),
        isPermanent,
        expiresAt: isPermanent ? undefined : new Date(expiresAt).toISOString(),
        notes: notes.trim() || undefined,
        blacklistTxHash: blacklistHashRef.current ?? undefined,
        cancelSaleTxHash: cancelHashRef.current ?? undefined,
      },
    });
    toast({ title: t("toasts.bannedTitle"), description: t("toasts.bannedMessage", { name: brand.brand.name }), variant: "success" });
    handleClose();
  };

  const { status: txStatus, write } = useTxFlow({
    abi: manaAdminAbi,
    address: CONTRACT_ADDRESSES.manaAdmin,
    onConfirmed: async (receipt) => {
      if (!selected) return;
      if (step === "blacklist-pending") {
        blacklistHashRef.current = receipt.transactionHash;
        if (hasOpenSale && escrowAddress) {
          setStep("cancel-pending");
          await write("cancelTokenSale", [escrowAddress]);
        } else {
          await submitBan(selected);
        }
      } else if (step === "cancel-pending") {
        cancelHashRef.current = receipt.transactionHash;
        await submitBan(selected);
      }
    },
    // Sans ça, une signature refusée/absente (wallet non connecté...) laissait le
    // modal bloqué en silence sur "confirmingBlacklist"/"confirmingCancelSale".
    onFailed: (error) => {
      toast({
        title: t("toasts.txFailedTitle"),
        description: error.message || t("toasts.txFailedMessage"),
        variant: "error",
      });
      setStep("pick");
    },
  });

  const reset = () => {
    setSearch("");
    setSelected(null);
    setReason("");
    setIsPermanent(true);
    setExpiresAt("");
    setNotes("");
    setStep("pick");
    blacklistHashRef.current = null;
    cancelHashRef.current = null;
  };

  const handleClose = () => {
    if (step !== "pick" && step !== "submitting") return; // laisser la séquence de tx se terminer
    reset();
    onClose();
  };

  const handleStart = async () => {
    if (!selected) {
      toast({ title: t("toasts.selectBrandTitle"), description: t("toasts.selectBrandMessage"), variant: "error" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: t("toasts.reasonRequiredTitle"), description: t("toasts.reasonRequiredMessage"), variant: "error" });
      return;
    }
    if (!isPermanent && !expiresAt) {
      toast({ title: t("toasts.expiryRequiredTitle"), description: t("toasts.expiryRequiredMessage"), variant: "error" });
      return;
    }
    if (!selected.ownerBlockchainAddress) {
      toast({
        title: t("toasts.noWalletTitle"),
        description: t("toasts.noWalletMessage"),
        variant: "error",
      });
      return;
    }
    setStep("blacklist-pending");
    await write("setBrandBlacklisted", [selected.ownerBlockchainAddress as Address, true]);
  };

  const isBusy = step !== "pick" || txStatus === "signing" || txStatus === "pending";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium block">{t("brandLabel")}</label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                <span>
                  {selected.brand.name}{" "}
                  <span className="text-muted-foreground">
                    ({selected.ownerBlockchainAddress
                      ? `${selected.ownerBlockchainAddress.slice(0, 6)}…${selected.ownerBlockchainAddress.slice(-4)}`
                      : t("noWalletLinked")})
                  </span>
                </span>
                {step === "pick" && (
                  <button type="button" className="text-xs text-violet-500 hover:underline" onClick={() => setSelected(null)}>
                    {t("change")}
                  </button>
                )}
              </div>
            ) : (
              <>
                <Input placeholder={t("searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
                {results.length > 0 && (
                  <div className="border border-border rounded-md divide-y divide-border max-h-48 overflow-y-auto">
                    {results.map((entry) => (
                      <button
                        key={entry.brand.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                        onClick={() => {
                          setSelected(entry);
                          setSearch("");
                        }}
                      >
                        {entry.brand.name} <span className="text-muted-foreground">({entry.brand.country})</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {selected && hasOpenSale && (
              <p className="text-xs text-amber-500">{t("openSaleWarning")}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">{t("reasonLabel")}</label>
            <Textarea
              className="min-h-[70px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isBusy}
              placeholder={t("reasonPlaceholder")}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ban-brand-permanent"
              checked={isPermanent}
              disabled={isBusy}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <label htmlFor="ban-brand-permanent" className="text-sm">
              {t("permanentBan")}
            </label>
          </div>

          {!isPermanent && (
            <div className="space-y-2">
              <label className="text-sm font-medium block">{t("expiresAtLabel")}</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={isBusy} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium block">{t("notesLabel")}</label>
            <Textarea
              className="min-h-[50px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={step === "submitting"}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleStart()}
            disabled={isBusy}
            className="bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
          >
            {step === "blacklist-pending"
              ? t("confirmingBlacklist")
              : step === "cancel-pending"
                ? t("confirmingCancelSale")
                : step === "submitting"
                  ? t("saving")
                  : t("submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
