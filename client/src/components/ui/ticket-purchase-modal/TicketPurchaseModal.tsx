"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import type { Address } from "viem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { mockUsdcAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";
import {
  useEventTicketTypes,
  getEventsControllerTicketTypesQueryKey,
  getEventsControllerMyTicketsQueryKey,
} from "@/hooks/api/useEvents";
import { useBuyTicket } from "@/hooks/web3/useBuyTicket";
import type { EventResponse } from "@/api/generated/models";

interface TicketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventResponse | null;
}

const USDC_DECIMALS = 6;

export function TicketPurchaseModal({ isOpen, onClose, event }: TicketPurchaseModalProps) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const ticketSaleAddress = event?.ticketSaleAddress as Address | undefined;

  const { data: ticketTypesData, isLoading: typesLoading } = useEventTicketTypes(event?.id, {
    enabled: isOpen && !!event,
  });
  const ticketTypes = useMemo(() => ticketTypesData ?? [], [ticketTypesData]);

  const [tokenId, setTokenId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: mockUsdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && isOpen },
  });

  const { needsApproval, approve, approveStatus, buy, buyStatus, buyError } = useBuyTicket(ticketSaleAddress);

  useEffect(() => {
    if (ticketTypes.length > 0 && !tokenId) {
      setTokenId(ticketTypes[0].tokenId);
    }
  }, [ticketTypes, tokenId]);

  useEffect(() => {
    if (buyStatus !== "confirmed" || !event) return;
    setIsSyncing(true);
    const timer = setTimeout(async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getEventsControllerTicketTypesQueryKey(event.id) }),
        queryClient.invalidateQueries({ queryKey: getEventsControllerMyTicketsQueryKey() }),
      ]);
      setIsSyncing(false);
      toast({ title: "Ticket purchased", description: `You're going to ${event.title}!`, variant: "success" });
      onClose();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyStatus]);

  if (!event) return null;

  const selectedType = ticketTypes.find((type) => type.tokenId === tokenId);
  const qtyNum = Number(quantity);
  const cost =
    selectedType && Number.isInteger(qtyNum) && qtyNum > 0
      ? BigInt(selectedType.price) * BigInt(qtyNum)
      : null;
  const mustApprove = cost != null ? needsApproval(cost) : false;
  const isBusy =
    approveStatus === "signing" || approveStatus === "pending" ||
    buyStatus === "signing" || buyStatus === "pending" || isSyncing;

  const handleClose = () => {
    if (isSyncing) return;
    setQuantity("1");
    onClose();
  };

  const handleApproveOrBuy = async () => {
    if (!selectedType || cost == null) {
      toast({ title: "Select a ticket", description: "Choose a ticket type and quantity.", variant: "error" });
      return;
    }
    if (mustApprove) {
      await approve(cost);
      return;
    }
    await buy(BigInt(selectedType.tokenId), BigInt(qtyNum));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
          <DialogDescription>Buy your tickets for this event, paid in USDC.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {typesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : !ticketSaleAddress || ticketTypes.length === 0 ? (
            <div className="bg-accent/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">Tickets aren&apos;t on sale for this event yet.</p>
            </div>
          ) : (
            <>
              <div className="bg-accent/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your USDC balance</span>
                  <span className="font-semibold">
                    {(Number(usdcBalance ?? BigInt(0)) / 10 ** USDC_DECIMALS).toFixed(2)} USDC
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Ticket type</label>
                <Select value={tokenId} onValueChange={setTokenId} className="w-full">
                  {ticketTypes.map((type) => (
                    <SelectItem key={type.tokenId} value={type.tokenId}>
                      {`Ticket #${type.tokenId} — ${
                        type.price === "0" ? "Free" : `${(Number(type.price) / 10 ** USDC_DECIMALS).toFixed(2)} USDC`
                      }`}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isBusy}
                />
                {cost != null && (
                  <p className="text-xs text-muted-foreground">
                    Total: {cost === BigInt(0) ? "Free" : `${(Number(cost) / 10 ** USDC_DECIMALS).toFixed(2)} USDC`}
                  </p>
                )}
              </div>
            </>
          )}

          <div className="flex flex-col gap-3">
            {ticketSaleAddress && ticketTypes.length > 0 ? (
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
                        : "Buy tickets"}
              </Button>
            ) : (
              <Button className="w-full" size="lg" disabled>
                Not Available Yet
              </Button>
            )}
            <Button onClick={handleClose} variant="ghost" className="w-full" disabled={isSyncing}>
              Close
            </Button>
          </div>
          {buyError && buyStatus === "failed" && <p className="text-sm text-destructive">{buyError.message}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
