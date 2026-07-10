"use client";

import { useRef, useState } from "react";
import type { Address } from "viem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    toast({ title: "Brand banned", description: `${brand.brand.name} has been banned.`, variant: "success" });
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
      toast({ title: "Select a brand", description: "Search and pick a brand to ban.", variant: "error" });
      return;
    }
    if (!reason.trim()) {
      toast({ title: "Reason required", description: "Explain why this brand is being banned.", variant: "error" });
      return;
    }
    if (!isPermanent && !expiresAt) {
      toast({ title: "Expiry required", description: "Set an expiry date for a temporary ban.", variant: "error" });
      return;
    }
    if (!selected.ownerBlockchainAddress) {
      toast({
        title: "No wallet linked",
        description: "This brand has no on-chain address — cannot blacklist it on-chain.",
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
          <DialogTitle>Ban a brand</DialogTitle>
          <DialogDescription>
            Signs a blacklist tx (+ a cancel-sale tx if a token sale is open), then records the audit entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium block">Brand</label>
            {selected ? (
              <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                <span>
                  {selected.brand.name}{" "}
                  <span className="text-muted-foreground">
                    ({selected.ownerBlockchainAddress
                      ? `${selected.ownerBlockchainAddress.slice(0, 6)}…${selected.ownerBlockchainAddress.slice(-4)}`
                      : "no wallet linked"})
                  </span>
                </span>
                {step === "pick" && (
                  <button type="button" className="text-xs text-violet-500 hover:underline" onClick={() => setSelected(null)}>
                    Change
                  </button>
                )}
              </div>
            ) : (
              <>
                <Input placeholder="Search by brand name…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              <p className="text-xs text-amber-500">This brand has an open token sale — it will also be cancelled on-chain.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium block">Reason</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[70px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isBusy}
              placeholder="Why is this brand being banned?"
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
              Permanent ban
            </label>
          </div>

          {!isPermanent && (
            <div className="space-y-2">
              <label className="text-sm font-medium block">Expires at</label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={isBusy} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium block">Internal notes (optional)</label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[50px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isBusy}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={step === "submitting"}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleStart()}
            disabled={isBusy}
            className="bg-linear-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
          >
            {step === "blacklist-pending"
              ? "Confirming blacklist tx…"
              : step === "cancel-pending"
                ? "Confirming cancel-sale tx…"
                : step === "submitting"
                  ? "Saving…"
                  : "Ban brand"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
