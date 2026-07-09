"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getBrandsControllerMyBrandQueryOptions,
  getBrandsControllerGetOneQueryOptions,
  getBrandsControllerMediaQueryOptions,
  getBrandsControllerMediaQueryKey,
  getBrandsControllerConfirmBrandMediaMutationOptions,
  getBrandsControllerRemoveMediaMutationOptions,
  getBrandsControllerListForWhitelistQueryOptions,
} from "@/api/generated/endpoints/brands/brands";
import type { BrandsControllerListForWhitelistParams } from "@/api/generated/models";
import { asAxiosError } from "@/lib/api-error";
import { useToastQuery } from "./useToastQuery";
import { useToastMutation } from "./useToastMutation";

/** Marque de l'utilisateur courant (remplace `BrandService.getMyBrand`). */
export function useMyBrand(options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getBrandsControllerMyBrandQueryOptions(),
    enabled: options?.enabled ?? true,
  });
}

/** Marques + adresse blockchain du propriétaire, admin only (whitelist on-chain). */
export function useBrandsForWhitelist(params?: BrandsControllerListForWhitelistParams) {
  return useToastQuery({
    ...getBrandsControllerListForWhitelistQueryOptions(params),
    errorToast: (error) => ({
      title: "Error",
      description:
        asAxiosError(error)?.response?.data?.message || "Failed to load brands.",
      variant: "error",
    }),
  });
}

/** Détail d'une marque par ID (remplace `BrandService.getBrandById`). */
export function useBrandById(brandId: string | undefined, options?: { enabled?: boolean }) {
  return useToastQuery({
    ...getBrandsControllerGetOneQueryOptions(brandId ?? ""),
    enabled: !!brandId && (options?.enabled ?? true),
  });
}

/** Médias d'une marque (remplace `BrandService.getBrandMedia`). */
export function useBrandMedia(brandId: string | undefined) {
  return useToastQuery({
    ...getBrandsControllerMediaQueryOptions(brandId ?? ""),
    enabled: !!brandId,
  });
}

/** Confirmer un média uploadé sur IPFS (remplace `BrandService.confirmBrandMedia`). */
export function useConfirmBrandMedia() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getBrandsControllerConfirmBrandMediaMutationOptions(),
    errorToast: (error) => ({
      title: "Error",
      description:
        asAxiosError(error)?.response?.data?.message || "Failed to confirm media. Please try again.",
      variant: "error",
    }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getBrandsControllerMediaQueryKey(variables.id) });
    },
  });
}

/** Supprimer un média (remplace `BrandService.deleteBrandMedia`). */
export function useRemoveBrandMedia() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getBrandsControllerRemoveMediaMutationOptions(),
    errorToast: (error) => ({
      title: "Error",
      description:
        asAxiosError(error)?.response?.data?.message || "Failed to delete media. Please try again.",
      variant: "error",
    }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getBrandsControllerMediaQueryKey(variables.id) });
    },
  });
}
