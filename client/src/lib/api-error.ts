import axios, { AxiosError } from "axios";

/** Shape of the JSON error body returned by the API. */
export interface ApiErrorPayload {
  error?: string;
  message?: string;
}

/** Narrows an unknown catch-clause error to a typed Axios error, if it is one. */
export function asAxiosError(err: unknown): AxiosError<ApiErrorPayload> | undefined {
  return axios.isAxiosError<ApiErrorPayload>(err) ? err : undefined;
}

/**
 * Fabrique le callback `errorToast` standard des hooks `hooks/api/*` :
 * message serveur si présent, sinon le fallback fourni. Pour les cas à
 * logique conditionnelle (switch sur `data.error`…), rester en inline.
 */
export function apiErrorToast(fallback: string, title = "Error") {
  return (error: unknown) => ({
    title,
    description: asAxiosError(error)?.response?.data?.message || fallback,
    variant: "error" as const,
  });
}
