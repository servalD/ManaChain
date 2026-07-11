import Axios, { AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from "axios";
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

// Instance nue (aucun intercepteur) pour l'appel de refresh lui-même : passer
// par `axiosInstance` re-déclencherait cet intercepteur de réponse en boucle.
const refreshInstance = Axios.create({ baseURL: API_ORIGIN });

function clearStoredSession() {
  localStorage.removeItem("Token");
  localStorage.removeItem("RefreshToken");
}

// Mutex : si N requêtes 401 arrivent en même temps, un seul appel /auth/refresh
// part (la rotation invaliderait sinon le refresh token au 2e appel concurrent,
// forçant une déconnexion pour rien).
let refreshPromise: Promise<string | null> | null = null;

function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem("RefreshToken");
  if (!refreshToken) return Promise.resolve(null);

  refreshPromise = refreshInstance
    .post<{ token: string; refreshToken: string }>("/api/auth/refresh", { refreshToken })
    .then(({ data }) => {
      localStorage.setItem("Token", data.token);
      localStorage.setItem("RefreshToken", data.refreshToken);
      return data.token;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;

    if (error.response?.status !== 401 || !config || config._retried) {
      return Promise.reject(error);
    }
    config._retried = true;

    const newToken = await refreshSession();
    if (!newToken) {
      clearStoredSession();
      if (typeof window !== "undefined") window.location.href = "/";
      return Promise.reject(error);
    }

    config.headers.Authorization = `Bearer ${newToken}`;
    return axiosInstance(config);
  },
);

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
