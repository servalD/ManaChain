"use client";

import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { useTxFlow } from "./useTxFlow";
import { mockUsdcAbi } from "@/lib/web3/generated";
import { CONTRACT_ADDRESSES } from "@/lib/web3/addresses";

const USDC_DECIMALS = 6;
/** Plafond côté contrat (10 000 USDC/appel) — voir MockUSDC.sol. */
export const FAUCET_MINT_AMOUNT = "1000";

interface UseUsdcFaucetCallbacks {
  onConfirmed?: () => void | Promise<void>;
  onFailed?: (error: Error) => void;
}

/** Mint de USDC de test, indépendant du contexte d'achat (bouton standalone). */
export function useUsdcFaucet({ onConfirmed, onFailed }: UseUsdcFaucetCallbacks = {}) {
  const { address } = useAccount();

  const { write, status } = useTxFlow({
    abi: mockUsdcAbi,
    address: CONTRACT_ADDRESSES.usdc,
    onConfirmed,
    onFailed,
  });

  const mint = async () => {
    if (!address) return;
    await write("mint", [address, parseUnits(FAUCET_MINT_AMOUNT, USDC_DECIMALS)]);
  };

  return { mint, status, hasWallet: !!address };
}
