/**
 * Imperative bridge between the React auth state (AuthContext) and the axios
 * interceptors, which live outside the component tree.
 *
 * AuthProvider registers its handlers on mount; the HMS client calls them.
 */
export interface AuthRuntime {
  /** Current access token, or null when signed out. */
  getAccessToken: () => string | null;
  /** Tenant headers derived from the decoded JWT. */
  getTenantHeaders: () => { tenantId: string | null; tenantSlug: string | null };
  /**
   * Silent refresh — must dedupe concurrent calls internally.
   * Resolves with the new access token; rejects when the session is dead.
   */
  refresh: () => Promise<string>;
  /** Repeated auth failure — drop the session and return to login. */
  forceLogout: () => void;
}

const noopRuntime: AuthRuntime = {
  getAccessToken: () => null,
  getTenantHeaders: () => ({ tenantId: null, tenantSlug: null }),
  refresh: () => Promise.reject(new Error("Auth runtime not ready")),
  forceLogout: () => undefined,
};

let runtime: AuthRuntime = noopRuntime;

export function registerAuthRuntime(next: AuthRuntime): () => void {
  runtime = next;
  return () => {
    runtime = noopRuntime;
  };
}

export function getAuthRuntime(): AuthRuntime {
  return runtime;
}
