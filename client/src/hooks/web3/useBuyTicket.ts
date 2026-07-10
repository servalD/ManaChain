"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";
import { useTxFlow } from "./useTxFlow";
import { ticketSaleAbi, mockUsdcAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";

/**
 * Flux d'achat de billets : approve USDC (si prix > 0) -> buy(tokenId, quantity).
 * `cost` est en unités brutes on-chain (6 décimales USDC), tel que renvoyé par TicketSale.
 */
export function useBuyTicket(ticketSaleAddress: Address | undefined) {
  const { address } = useAccount();

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: mockUsdcAbi,
    functionName: "allowance",
    args: address && ticketSaleAddress ? [address, ticketSaleAddress] : undefined,
    query: { enabled: !!address && !!ticketSaleAddress },
  });

  const approveFlow = useTxFlow({
    abi: mockUsdcAbi,
    address: CONTRACT_ADDRESSES.usdc,
    onConfirmed: async () => {
      await refetchAllowance();
    },
  });

  const buyFlow = useTxFlow({
    abi: ticketSaleAbi,
    address: ticketSaleAddress,
    onConfirmed: async () => {
      await refetchAllowance();
    },
  });

  const approve = async (cost: bigint) => {
    if (!ticketSaleAddress) return;
    await approveFlow.write("approve", [ticketSaleAddress, cost]);
  };

  const buy = async (tokenId: bigint, quantity: bigint) => {
    if (!ticketSaleAddress) return;
    await buyFlow.write("buy", [tokenId, quantity]);
  };

  const needsApproval = useCallback(
    (cost: bigint) => cost > BigInt(0) && (usdcAllowance ?? BigInt(0)) < cost,
    [usdcAllowance],
  );

  return {
    usdcAllowance: usdcAllowance ?? BigInt(0),
    needsApproval,
    approve,
    approveStatus: approveFlow.status,
    approveError: approveFlow.error,
    buy,
    buyStatus: buyFlow.status,
    buyError: buyFlow.error,
    buyHash: buyFlow.hash,
  };
}
