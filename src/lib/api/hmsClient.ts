/**
 * Axios client for the dghms (HMS) backend.
 *
 * - Injects `Authorization: Bearer <access>` plus tenant headers on every call.
 * - On 401: silently refreshes once and retries the request; if the refresh
 *   fails or the retry still 401s, forces re-login.
 */
import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { HMS_BASE_URL } from "../config";
import { getAuthRuntime } from "../auth/authRuntime";

export const hmsClient = axios.create({
  baseURL: `${HMS_BASE_URL}/api`,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

hmsClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { getAccessToken, getTenantHeaders } = getAuthRuntime();
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  const { tenantId, tenantSlug } = getTenantHeaders();
  if (tenantId) config.headers.set("x-tenant-id", tenantId);
  if (tenantSlug) config.headers.set("x-tenant-slug", tenantSlug);
  // Django runs with APPEND_SLASH — avoid 301s on POST/PUT by defaulting to it.
  if (config.url && !config.url.endsWith("/")) {
    config.url += "/";
  }
  return config;
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _authRetried?: boolean;
}

hmsClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined;
    if (error.response?.status !== 401 || !original || original._authRetried) {
      return Promise.reject(error);
    }

    original._authRetried = true;
    const { refresh, forceLogout } = getAuthRuntime();
    try {
      await refresh();
    } catch {
      forceLogout();
      return Promise.reject(error);
    }

    // Retry once with the fresh token (request interceptor re-injects it).
    try {
      return await hmsClient.request(original);
    } catch (retryError) {
      if (
        retryError instanceof AxiosError &&
        retryError.response?.status === 401
      ) {
        forceLogout();
      }
      return Promise.reject(retryError);
    }
  }
);

/** Standard dghms list envelope (common/pagination.py StandardPagination). */
export interface Paginated<T> {
  success: boolean;
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function hmsGet<T>(path: string, config?: AxiosRequestConfig) {
  const { data } = await hmsClient.get<T>(path, config);
  return data;
}

export async function hmsPost<T, B = unknown>(
  path: string,
  body?: B,
  config?: AxiosRequestConfig
) {
  const { data } = await hmsClient.post<T>(path, body, config);
  return data;
}

export async function hmsPatch<T, B = unknown>(
  path: string,
  body?: B,
  config?: AxiosRequestConfig
) {
  const { data } = await hmsClient.patch<T>(path, body, config);
  return data;
}

export async function hmsDelete<T = void>(
  path: string,
  config?: AxiosRequestConfig
) {
  const { data } = await hmsClient.delete<T>(path, config);
  return data;
}
