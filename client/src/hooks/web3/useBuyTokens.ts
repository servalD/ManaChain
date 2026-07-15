"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits, type Address } from "viem";
import { useTxFlow } from "./useTxFlow";
import { useUsdcFaucet, FAUCET_MINT_AMOUNT } from "./useUsdcFaucet";
import { tokenSaleEscrowAbi, mockUsdcAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";

export { FAUCET_MINT_AMOUNT };

const USDC_DECIMALS = 6;
const SUPPORT_TOKEN_DECIMALS = 18;

/**
 * Flux d'achat : approve USDC (si besoin) -> buy. `pricePerToken` est le prix
 * brut on-chain (unités USDC, 6 décimales) tel que renvoyé par `token.sale`.
 */
export function useBuyTokens(escrowAddress: Address | undefined, pricePerToken: string | undefined) {
  const { address } = useAccount();

  const { data: usdcBalance, refetch: refetchBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: mockUsdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: usdcAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: mockUsdcAbi,
    functionName: "allowance",
    args: address && escrowAddress ? [address, escrowAddress] : undefined,
    query: { enabled: !!address && !!escrowAddress },
  });

  const approveFlow = useTxFlow({
    abi: mockUsdcAbi,
    address: CONTRACT_ADDRESSES.usdc,
    onConfirmed: async () => {
      await refetchAllowance();
    },
  });

  const buyFlow = useTxFlow({
    abi: tokenSaleEscrowAbi,
    address: escrowAddress,
    onConfirmed: async () => {
      await Promise.all([refetchBalance(), refetchAllowance()]);
    },
  });

  const faucet = useUsdcFaucet({
    onConfirmed: async () => {
      await refetchBalance();
    },
  });

  /** Coût estimé (arrondi haut côté contrat) pour `amountHuman` tokens entiers. */
  const estimateCost = useCallback(
    (amountHuman: string): bigint | null => {
      if (!pricePerToken || !amountHuman.trim()) return null;
      try {
        const amountRaw = parseUnits(amountHuman.trim(), SUPPORT_TOKEN_DECIMALS);
        const price = BigInt(pricePerToken);
        const unit = parseUnits("1", SUPPORT_TOKEN_DECIMALS);
        const cost = (amountRaw * price + unit - BigInt(1)) / unit; // ceil, comme le contrat
        return cost;
      } catch {
        return null;
      }
    },
    [pricePerToken],
  );

  const buy = async (amountHuman: string) => {
    if (!escrowAddress) return;
    const amountRaw = parseUnits(amountHuman.trim(), SUPPORT_TOKEN_DECIMALS);
    await buyFlow.write("buy", [amountRaw]);
  };

  const approve = async (amountHuman: string) => {
    if (!escrowAddress) return;
    const cost = estimateCost(amountHuman);
    if (cost == null) return;
    await approveFlow.write("approve", [escrowAddress, cost]);
  };

  const needsApproval = useCallback(
    (amountHuman: string) => {
      const cost = estimateCost(amountHuman);
      if (cost == null) return false;
      return (usdcAllowance ?? BigInt(0)) < cost;
    },
    [usdcAllowance, estimateCost],
  );

  return {
    usdcBalance: usdcBalance ?? BigInt(0),
    usdcBalanceFormatted: formatUnits(usdcBalance ?? BigInt(0), USDC_DECIMALS),
    usdcAllowance: usdcAllowance ?? BigInt(0),
    estimateCost,
    needsApproval,
    approve,
    approveStatus: approveFlow.status,
    approveError: approveFlow.error,
    buy,
    buyStatus: buyFlow.status,
    buyError: buyFlow.error,
    buyHash: buyFlow.hash,
    mintFaucet: faucet.mint,
    faucetStatus: faucet.status,
  };
}
