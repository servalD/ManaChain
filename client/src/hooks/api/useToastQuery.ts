"use client";

import { useEffect, useRef } from "react";
import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { toast, type ToastOptions } from "@/lib/toast";

export interface ToastQueryOptions<TQueryFnData, TError, TData>
  extends UseQueryOptions<TQueryFnData, TError, TData> {
  /** Retourne les options du toast à afficher en erreur, ou `undefined`/`void` pour ne rien afficher. */
  errorToast?: (error: TError) => ToastOptions | void;
}

/**
 * Fine surcouche de `useQuery` qui déclenche un toast d'erreur via `errorToast`.
 * TanStack Query v5 a retiré `onError` de `useQuery` ; on le reconstitue avec un
 * `useEffect` sur `isError`/`error`, en ne notifiant qu'une fois par erreur
 * distincte (pas à chaque re-render tant que l'erreur ne change pas).
 */
export function useToastQuery<TQueryFnData, TError = unknown, TData = TQueryFnData>(
  options: ToastQueryOptions<TQueryFnData, TError, TData>,
): UseQueryResult<TData, TError> {
  const { errorToast, ...rest } = options;
  const query = useQuery(rest);
  const lastNotifiedError = useRef<TError | null>(null);

  useEffect(() => {
    if (query.isError) {
      if (query.error !== lastNotifiedError.current) {
        lastNotifiedError.current = query.error;
        const params = errorToast?.(query.error);
        if (params) toast(params);
      }
    } else {
      lastNotifiedError.current = null;
    }
  }, [query.isError, query.error, errorToast]);

  return query;
}
