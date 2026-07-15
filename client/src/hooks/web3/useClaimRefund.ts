"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import type { Address } from "viem";
import { useTxFlow } from "./useTxFlow";
import { tokenSaleEscrowAbi, brandSupportTokenAbi } from "@/lib/web3/generated";

interface UseClaimRefundCallbacks {
  onApproveFailed?: (error: Error) => void;
  onClaimFailed?: (error: Error) => void;
}

/**
 * Remboursement d'une vente annulée : approve support token -> escrow.claimRefund(amount).
 * `amount` est en unités brutes du support token (18 décimales), borné par `getBoughtOf`.
 */
export function useClaimRefund(
  escrowAddress: Address | undefined,
  supportTokenAddress: Address | undefined,
  callbacks: UseClaimRefundCallbacks = {},
) {
  const { address } = useAccount();
  const { onApproveFailed, onClaimFailed } = callbacks;

  const { data: boughtOf, refetch: refetchBoughtOf } = useReadContract({
    address: escrowAddress,
    abi: tokenSaleEscrowAbi,
    functionName: "getBoughtOf",
    args: address ? [address] : undefined,
    query: { enabled: !!escrowAddress && !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: supportTokenAddress,
    abi: brandSupportTokenAbi,
    functionName: "allowance",
    args: address && escrowAddress ? [address, escrowAddress] : undefined,
    query: { enabled: !!supportTokenAddress && !!address && !!escrowAddress },
  });

  const approveFlow = useTxFlow({
    abi: brandSupportTokenAbi,
    address: supportTokenAddress,
    onConfirmed: async () => {
      await refetchAllowance();
    },
    onFailed: onApproveFailed,
  });

  const claimFlow = useTxFlow({
    abi: tokenSaleEscrowAbi,
    address: escrowAddress,
    onConfirmed: async () => {
      await Promise.all([refetchBoughtOf(), refetchAllowance()]);
    },
    onFailed: onClaimFailed,
  });

  const approve = async (amountRaw: bigint) => {
    if (!supportTokenAddress || !escrowAddress) return;
    await approveFlow.write("approve", [escrowAddress, amountRaw]);
  };

  const claim = async (amountRaw: bigint) => {
    if (!escrowAddress) return;
    await claimFlow.write("claimRefund", [amountRaw]);
  };

  const needsApproval = useCallback(
    (amountRaw: bigint) => amountRaw > BigInt(0) && (allowance ?? BigInt(0)) < amountRaw,
    [allowance],
  );

  return {
    boughtOf: boughtOf ?? BigInt(0),
    needsApproval,
    approve,
    approveStatus: approveFlow.status,
    approveError: approveFlow.error,
    claim,
    claimStatus: claimFlow.status,
    claimError: claimFlow.error,
  };
}
