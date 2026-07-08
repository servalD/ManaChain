"use client";

import {
  useMutation,
  type QueryClient,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { toast, type ToastOptions } from "@/lib/toast";
import { asAxiosError } from "@/lib/api-error";

export interface ToastMutationOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  /** Retourne les options du toast à afficher en succès, ou `undefined`/`void` pour n'afficher aucun toast. */
  successToast?: (data: TData, variables: TVariables) => ToastOptions | void;
  /**
   * Retourne les options du toast à afficher en erreur, ou `undefined`/`void` pour
   * ne rien afficher pour ce cas précis. Si `errorToast` n'est pas fourni du tout,
   * un toast générique basé sur le message serveur est affiché par défaut.
   */
  errorToast?: (error: TError, variables: TVariables) => ToastOptions | void;
}

/**
 * Fine surcouche de `useMutation` qui factorise le pattern toast de
 * succès/erreur répété dans les wrappers de `client/src/hooks/api/*`. Les
 * `onSuccess`/`onError` fournis restent appelés après le toast, pour composer
 * avec des effets de bord spécifiques (localStorage, redirect, invalidation).
 */
export function useToastMutation<TData, TError = unknown, TVariables = void, TContext = unknown>(
  options: ToastMutationOptions<TData, TError, TVariables, TContext>,
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { successToast, errorToast, onSuccess, onError, ...rest } = options;

  return useMutation(
    {
      ...rest,
      onSuccess: (data, variables, onMutateResult, context) => {
        const params = successToast?.(data, variables);
        if (params) toast(params);
        return onSuccess?.(data, variables, onMutateResult, context);
      },
      onError: (error, variables, onMutateResult, context) => {
        if (errorToast) {
          const params = errorToast(error, variables);
          if (params) toast(params);
        } else {
          toast({
            title: "Error",
            description:
              asAxiosError(error)?.response?.data?.message ?? "An unexpected error occurred",
            variant: "error",
          });
        }
        return onError?.(error, variables, onMutateResult, context);
      },
    },
    queryClient,
  );
}
