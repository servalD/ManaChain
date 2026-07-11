"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getBrandsControllerBansQueryOptions,
  getBrandsControllerBanMutationOptions,
  getBrandsControllerUnbanMutationOptions,
  getBrandsControllerBansQueryKey,
} from "@/api/generated/endpoints/brands/brands";
import {
  getUsersControllerBansQueryOptions,
  getUsersControllerBanMutationOptions,
  getUsersControllerUnbanMutationOptions,
  getUsersControllerBansQueryKey,
} from "@/api/generated/endpoints/users/users";
import type {
  BrandsControllerBansParams,
  UsersControllerBansParams,
} from "@/api/generated/models";
import { apiErrorToast } from "@/lib/api-error";
import { useToastQuery } from "./useToastQuery";
import { useToastMutation } from "./useToastMutation";

/** Liste admin des bans de marques. */
export function useBrandBans(params?: BrandsControllerBansParams) {
  return useToastQuery({ ...getBrandsControllerBansQueryOptions(params) });
}

export function useBanBrand() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getBrandsControllerBanMutationOptions(),
    errorToast: apiErrorToast("Failed to ban brand."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandsControllerBansQueryKey() });
    },
  });
}

export function useUnbanBrand() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getBrandsControllerUnbanMutationOptions(),
    errorToast: apiErrorToast("Failed to lift ban."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBrandsControllerBansQueryKey() });
    },
  });
}

/** Liste admin des bans d'utilisateurs. */
export function useUserBans(params?: UsersControllerBansParams) {
  return useToastQuery({ ...getUsersControllerBansQueryOptions(params) });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getUsersControllerBanMutationOptions(),
    errorToast: apiErrorToast("Failed to ban user."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersControllerBansQueryKey() });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getUsersControllerUnbanMutationOptions(),
    errorToast: apiErrorToast("Failed to lift ban."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getUsersControllerBansQueryKey() });
    },
  });
}
