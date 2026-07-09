"use client";

import {
  getTokensControllerGetOneQueryOptions,
  getTokensControllerByBrandQueryOptions,
  getTokensControllerMyPortfolioQueryOptions,
  getTokensControllerMyTransactionsQueryOptions,
  getTokensControllerBalanceQueryOptions,
  getTokensControllerHoldersQueryOptions,
} from "@/api/generated/endpoints/tokens/tokens";
import type { TokensControllerMyTransactionsParams } from "@/api/generated/models";
import { useToastQuery } from "./useToastQuery";

/** Token par id, avec les adresses/vente on-chain (remplace tout mock). */
export function useToken(tokenId: string | undefined, options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getTokensControllerGetOneQueryOptions(tokenId ?? ""),
    enabled: !!tokenId && (options?.enabled ?? true),
  });
}

/** Token d'une marque (peut être absent si la marque n'a pas encore déployé son module). */
export function useTokenByBrand(brandId: string | undefined, options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getTokensControllerByBrandQueryOptions(brandId ?? ""),
    enabled: !!brandId && (options?.enabled ?? true),
    retry: false,
  });
}

/** Portefeuille de l'utilisateur courant (soldes > 0, alimenté par chain-sync). */
export function useMyPortfolio(options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getTokensControllerMyPortfolioQueryOptions(),
    enabled: options?.enabled ?? true,
  });
}

/** Transactions de l'utilisateur courant (alimenté par chain-sync). */
export function useMyTransactions(params?: TokensControllerMyTransactionsParams) {
  return useToastQuery({
    ...getTokensControllerMyTransactionsQueryOptions(params),
  });
}

/** Solde de l'utilisateur courant pour un token donné. */
export function useTokenBalance(tokenId: string | undefined, options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getTokensControllerBalanceQueryOptions(tokenId ?? ""),
    enabled: !!tokenId && (options?.enabled ?? true),
  });
}

/** Détenteurs d'un token (pour afficher un total ; `limit: 1` suffit). */
export function useTokenHoldersCount(tokenId: string | undefined, options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getTokensControllerHoldersQueryOptions(tokenId ?? "", { limit: 1, offset: 0 }),
    enabled: !!tokenId && (options?.enabled ?? true),
  });
}
