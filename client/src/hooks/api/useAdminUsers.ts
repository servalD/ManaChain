"use client";

import { getUsersControllerFindAllQueryOptions } from "@/api/generated/endpoints/users/users";
import { getBrandsControllerListActiveQueryOptions } from "@/api/generated/endpoints/brands/brands";
import type { UsersControllerFindAllParams } from "@/api/generated/models";
import type { BrandsControllerListActiveParams } from "@/api/generated/models";
import { useToastQuery } from "./useToastQuery";

/** Liste paginée des utilisateurs, admin only (remplace `AdminService.getUsers`). */
export function useAdminUsersList(params?: UsersControllerFindAllParams) {
  return useToastQuery({
    ...getUsersControllerFindAllQueryOptions(params),
  });
}

/** Liste paginée des marques actives, admin only (remplace `AdminService.getActiveBrands`). */
export function useAdminActiveBrands(params?: BrandsControllerListActiveParams) {
  return useToastQuery({
    ...getBrandsControllerListActiveQueryOptions(params),
  });
}
