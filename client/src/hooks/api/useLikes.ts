"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  getLikesControllerMyLikesQueryOptions,
  getLikesControllerMyLikesQueryKey,
  getLikesControllerBrandLikesQueryOptions,
  getLikesControllerCreateMutationOptions,
  getLikesControllerRemoveMutationOptions,
} from "@/api/generated/endpoints/likes/likes";
import { asAxiosError } from "@/lib/api-error";
import { useToastQuery } from "./useToastQuery";
import { useToastMutation } from "./useToastMutation";

/** Marques aimées par l'utilisateur courant (remplace `LikeService.getUserLikes`). */
export function useMyLikes() {
  return useToastQuery({
    ...getLikesControllerMyLikesQueryOptions(),
    errorToast: () => ({
      title: "Error",
      description: "Failed to fetch your liked brands.",
      variant: "error",
    }),
  });
}

/** Likes reçus par une marque (remplace `LikeService.getBrandLikes`). */
export function useBrandLikes(brandId: string) {
  return useToastQuery({
    ...getLikesControllerBrandLikesQueryOptions(brandId),
    errorToast: () => ({
      title: "Error",
      description: "Failed to fetch brand likes.",
      variant: "error",
    }),
  });
}

/** Aimer une marque (remplace `LikeService.createLike`). */
export function useCreateLike() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getLikesControllerCreateMutationOptions(),
    successToast: () => ({
      title: "Brand Liked!",
      description: "You have successfully liked this brand.",
      variant: "success",
    }),
    errorToast: (error) => ({
      title: "Error",
      description:
        asAxiosError(error)?.response?.data?.message || "Failed to like brand. Please try again.",
      variant: "error",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLikesControllerMyLikesQueryKey() });
    },
  });
}

/** Retirer un like (remplace `LikeService.deleteLike`). */
export function useDeleteLike() {
  const queryClient = useQueryClient();
  return useToastMutation({
    ...getLikesControllerRemoveMutationOptions(),
    successToast: () => ({
      title: "Like removed",
      description: "You've removed this brand from your liked list.",
      variant: "success",
    }),
    errorToast: (error) => ({
      title: "Error",
      description:
        asAxiosError(error)?.response?.data?.message || "Failed to remove like. Please try again.",
      variant: "error",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getLikesControllerMyLikesQueryKey() });
    },
  });
}
