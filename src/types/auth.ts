/**
 * Auth/JWT types matching the SuperAdmin (admin.celiyo.com) contract.
 * Claims confirmed against superadmin/apps/accounts/services.py.
 */

/** Custom claims embedded in the SuperAdmin-issued JWT. */
export interface JWTPayload {
  user_id: string;
  email: string;
  tenant_id: string | null;
  tenant_slug: string | null;
  tenant_name: string | null;
  is_super_admin: boolean;
  permissions: Record<string, unknown>;
  enabled_modules: string[];
  roles: string[];
  exp: number;
  iat: number;
  jti?: string;
  token_type?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

/** `user` object returned by POST /api/auth/login/. */
export interface LoginUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant: string | null;
  tenant_name: string | null;
  is_super_admin: boolean;
  roles: Array<{ id: string; name: string }>;
  profile_picture?: string | null;
}

export interface LoginResponse {
  message: string;
  user: LoginUser;
  tokens: AuthTokens;
}

/** Session state derived from the decoded access token. */
export interface AuthSession {
  userId: string;
  email: string;
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  isSuperAdmin: boolean;
  permissions: Record<string, unknown>;
  roles: string[];
  expiresAt: number; // seconds since epoch
}

export function sessionFromPayload(payload: JWTPayload): AuthSession {
  return {
    userId: payload.user_id,
    email: payload.email,
    tenantId: payload.tenant_id,
    tenantSlug: payload.tenant_slug,
    tenantName: payload.tenant_name,
    isSuperAdmin: payload.is_super_admin,
    permissions: payload.permissions ?? {},
    roles: payload.roles ?? [],
    expiresAt: payload.exp,
  };
}
