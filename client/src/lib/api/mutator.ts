import Axios, { AxiosRequestConfig, AxiosError } from "axios";
import { ApiService } from "@/services/api.service";

const API_ORIGIN = ApiService.baseURL.replace(/\/api\/?$/, "");

export const axiosInstance = Axios.create({
  baseURL: API_ORIGIN,
  // Nest attend des clés répétées pour les paramètres tableau
  // (`excludeBrandIds=a&excludeBrandIds=b`), pas le `excludeBrandIds[]=`
  // qu'axios produit par défaut.
  paramsSerializer: { indexes: null },
});

axiosInstance.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("Token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = axiosInstance({ ...config, cancelToken: source.token }).then(
    ({ data }) => data,
  );

  // @ts-expect-error react-query reads `.cancel` off the returned promise to abort in-flight requests
  promise.cancel = () => {
    source.cancel("Query was cancelled");
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;
