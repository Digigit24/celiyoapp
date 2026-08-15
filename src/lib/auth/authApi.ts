/**
 * Auth API calls against the SuperAdmin backend (admin.celiyo.com).
 * Mobile calls it directly — there is no BFF in between (unlike celiyohms).
 */
import axios, { AxiosError } from "axios";
import { AUTH_BASE_URL, AUTH_ENDPOINTS } from "../config";
import type { AuthTokens, LoginResponse } from "../../types/auth";

/** Bare client for auth calls — no interceptors, no auth headers. */
export const authHttp = axios.create({
  baseURL: AUTH_BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const { data } = await authHttp.post<LoginResponse>(AUTH_ENDPOINTS.login, {
      email,
      password,
    });
    return data;
  } catch (err) {
    if (err instanceof AxiosError) {
      const detail =
        (err.response?.data as { error?: string; detail?: string } | undefined)
          ?.error ??
        (err.response?.data as { detail?: string } | undefined)?.detail;
      throw new AuthError(
        detail ?? "Login failed. Check your connection and try again.",
        err.response?.status
      );
    }
    throw err;
  }
}

/**
 * Exchange a refresh token for a new access token.
 * The backend does not rotate refresh tokens (ROTATE_REFRESH_TOKENS = False).
 */
export async function refreshAccessToken(refresh: string): Promise<string> {
  const { data } = await authHttp.post<{ access: string }>(
    AUTH_ENDPOINTS.refresh,
    { refresh }
  );
  return data.access;
}

/** Blacklist the refresh token server-side. Best-effort — never throws. */
export async function logoutRemote(tokens: AuthTokens | null): Promise<void> {
  if (!tokens) return;
  try {
    await authHttp.post(
      AUTH_ENDPOINTS.logout,
      { refresh_token: tokens.refresh },
      { headers: { Authorization: `Bearer ${tokens.access}` } }
    );
  } catch {
    // Local logout proceeds regardless.
  }
}
