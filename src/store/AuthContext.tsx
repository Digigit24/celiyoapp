/**
 * Session provider.
 *
 * - Restores tokens from expo-secure-store on launch (survives app restart).
 * - Schedules a silent refresh just before the access token expires.
 * - Exposes getPrimaryRole / hasPermission helpers bound to the session.
 * - Registers the imperative auth runtime used by the axios interceptors.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { REFRESH_AHEAD_MS } from "../lib/config";
import {
  login as apiLogin,
  logoutRemote,
  refreshAccessToken,
} from "../lib/auth/authApi";
import { registerAuthRuntime } from "../lib/auth/authRuntime";
import {
  clearTokens,
  loadTokens,
  saveAccessToken,
  saveTokens,
} from "../lib/auth/tokenStorage";
import {
  decodeJWT,
  getPrimaryRole,
  hasPermission,
  type PrimaryRole,
} from "../lib/auth/permissions";
import type { AuthSession, AuthTokens } from "../types/auth";
import { sessionFromPayload } from "../types/auth";

interface AuthContextValue {
  status: "loading" | "signedIn" | "signedOut";
  session: AuthSession | null;
  primaryRole: PrimaryRole | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);

  const tokensRef = useRef<AuthTokens | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const applyAccessToken = useCallback(
    (access: string, refresh: string): AuthSession => {
      const next = sessionFromPayload(decodeJWT(access));
      tokensRef.current = { access, refresh };
      setSession(next);

      // Schedule the silent refresh just before expiry.
      clearRefreshTimer();
      const delay = next.expiresAt * 1000 - Date.now() - REFRESH_AHEAD_MS;
      refreshTimerRef.current = setTimeout(
        () => {
          void doRefreshRef.current().catch(() => forceLogoutRef.current());
        },
        Math.max(delay, 0)
      );
      return next;
    },
    [clearRefreshTimer]
  );

  /** Deduped silent refresh — concurrent callers share one request. */
  const doRefresh = useCallback(async (): Promise<string> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const promise = (async () => {
      const tokens = tokensRef.current;
      if (!tokens) throw new Error("No session to refresh");
      const access = await refreshAccessToken(tokens.refresh);
      await saveAccessToken(access);
      applyAccessToken(access, tokens.refresh);
      return access;
    })();

    refreshPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      refreshPromiseRef.current = null;
    }
  }, [applyAccessToken]);

  const forceLogout = useCallback(() => {
    clearRefreshTimer();
    tokensRef.current = null;
    void clearTokens();
    setSession(null);
    setStatus("signedOut");
  }, [clearRefreshTimer]);

  // Refs so the refresh timer callback never goes stale.
  const doRefreshRef = useRef(doRefresh);
  const forceLogoutRef = useRef(forceLogout);
  useEffect(() => {
    doRefreshRef.current = doRefresh;
    forceLogoutRef.current = forceLogout;
  }, [doRefresh, forceLogout]);

  // Imperative runtime for the axios interceptors.
  useEffect(() => {
    return registerAuthRuntime({
      getAccessToken: () => tokensRef.current?.access ?? null,
      getTenantHeaders: () => ({
        tenantId: tokensRef.current
          ? sessionFromPayload(decodeJWT(tokensRef.current.access)).tenantId
          : null,
        tenantSlug: tokensRef.current
          ? sessionFromPayload(decodeJWT(tokensRef.current.access)).tenantSlug
          : null,
      }),
      refresh: () => doRefreshRef.current(),
      forceLogout: () => forceLogoutRef.current(),
    });
  }, []);

  // Restore the persisted session on launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokens = await loadTokens();
        if (!tokens) {
          if (!cancelled) setStatus("signedOut");
          return;
        }
        const payload = decodeJWT(tokens.access);
        if (payload.exp * 1000 - Date.now() < REFRESH_AHEAD_MS) {
          // Expired or nearly so — refresh before declaring the session live.
          const access = await refreshAccessToken(tokens.refresh);
          await saveAccessToken(access);
          if (!cancelled) {
            applyAccessToken(access, tokens.refresh);
            setStatus("signedIn");
          }
          return;
        }
        if (!cancelled) {
          applyAccessToken(tokens.access, tokens.refresh);
          setStatus("signedIn");
        }
      } catch {
        await clearTokens();
        if (!cancelled) {
          tokensRef.current = null;
          setSession(null);
          setStatus("signedOut");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyAccessToken]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin(email.trim(), password);
      await saveTokens(response.tokens);
      applyAccessToken(response.tokens.access, response.tokens.refresh);
      setStatus("signedIn");
    },
    [applyAccessToken]
  );

  const signOut = useCallback(async () => {
    const tokens = tokensRef.current;
    clearRefreshTimer();
    tokensRef.current = null;
    setSession(null);
    setStatus("signedOut");
    await clearTokens();
    void logoutRemote(tokens);
  }, [clearRefreshTimer]);

  const can = useCallback(
    (permission: string) =>
      hasPermission(session?.permissions, permission, session?.isSuperAdmin),
    [session]
  );

  const primaryRole = useMemo(
    () => getPrimaryRole(session?.roles, session?.isSuperAdmin),
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, primaryRole, signIn, signOut, can }),
    [status, session, primaryRole, signIn, signOut, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
