"use client";

import { useTxFlow } from "./useTxFlow";
import { tokenSaleEscrowAbi } from "@/lib/web3/generated";
import type { Address } from "viem";

/**
 * Actions brand sur une vente : clôturer, annuler, réclamer les fonds
 * (`TokenSaleEscrow.endSale/cancelByBrand/claimByBrand`). `onConfirmed` invalide
 * la query API (l'indexer met à jour `token.sale.status`/`soldAmount` de son côté).
 */
export function useSaleManagement(escrowAddress: Address | undefined, onConfirmed: () => void | Promise<void>) {
  const endSaleFlow = useTxFlow({ abi: tokenSaleEscrowAbi, address: escrowAddress, onConfirmed });
  const cancelFlow = useTxFlow({ abi: tokenSaleEscrowAbi, address: escrowAddress, onConfirmed });
  const claimFlow = useTxFlow({ abi: tokenSaleEscrowAbi, address: escrowAddress, onConfirmed });

  return {
    endSale: () => endSaleFlow.write("endSale", []),
    endSaleStatus: endSaleFlow.status,
    endSaleError: endSaleFlow.error,
    cancel: () => cancelFlow.write("cancelByBrand", []),
    cancelStatus: cancelFlow.status,
    cancelError: cancelFlow.error,
    claim: () => claimFlow.write("claimByBrand", []),
    claimStatus: claimFlow.status,
    claimError: claimFlow.error,
  };
}
