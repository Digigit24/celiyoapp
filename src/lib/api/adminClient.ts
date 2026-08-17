/**
 * Shared axios client for superadmin (admin.celiyo.com) resource endpoints —
 * tenant settings, staff/user management, roles. Distinct from `authApi.ts`'s
 * bare `authHttp` (login/refresh/logout, no auth header needed) and from
 * `hmsClient.ts` (dghms, the HMS API of record). Same bearer JWT as
 * everywhere else in the app — superadmin issues it.
 */
import axios, { AxiosRequestConfig } from "axios";
import { AUTH_BASE_URL } from "../config";
import { getAuthRuntime } from "../auth/authRuntime";

export const adminClient = axios.create({
  baseURL: `${AUTH_BASE_URL}/api`,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

adminClient.interceptors.request.use((config) => {
  const token = getAuthRuntime().getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  if (config.url && !config.url.endsWith("/")) config.url += "/";
  return config;
});

export async function adminGet<T>(path: string, config?: AxiosRequestConfig) {
  const { data } = await adminClient.get<T>(path, config);
  return data;
}

export async function adminPost<T, B = unknown>(
  path: string,
  body?: B,
  config?: AxiosRequestConfig
) {
  const { data } = await adminClient.post<T>(path, body, config);
  return data;
}

export async function adminPatch<T, B = unknown>(
  path: string,
  body?: B,
  config?: AxiosRequestConfig
) {
  const { data } = await adminClient.patch<T>(path, body, config);
  return data;
}

export async function adminDelete<T = void>(
  path: string,
  config?: AxiosRequestConfig
) {
  const { data } = await adminClient.delete<T>(path, config);
  return data;
}
