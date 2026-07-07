"use client";

import { getInterestsControllerListQueryOptions } from "@/api/generated/endpoints/interests/interests";
import { asAxiosError } from "@/lib/api-error";
import { useToastQuery } from "./useToastQuery";

/** Liste des centres d'intérêt disponibles (remplace `InterestsService.getAllInterests`). */
export function useInterests() {
  return useToastQuery({
    ...getInterestsControllerListQueryOptions(),
    errorToast: (error) => {
      const axiosErr = asAxiosError(error);
      if (axiosErr?.response) {
        switch (axiosErr.response.status) {
          case 404:
            return {
              title: "Interests not found",
              description: "Unable to load available interests",
              variant: "error",
            };
          case 500:
            return {
              title: "Server error",
              description: "Temporary issue loading interests",
              variant: "error",
            };
          default:
            return {
              title: "Error loading interests",
              description: axiosErr.response.data?.message || "An unexpected error occurred",
              variant: "error",
            };
        }
      }
      if (axiosErr?.request) {
        return {
          title: "Connection error",
          description: "Unable to reach the server",
          variant: "error",
        };
      }
      return {
        title: "Error loading interests",
        description: "An unexpected error occurred",
        variant: "error",
      };
    },
  });
}
