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
