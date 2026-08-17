/**
 * Types for superadmin's (admin.celiyo.com) staff/role administration domain
 * — `CustomUser`/`Role` at `/api/users/` and `/api/roles/`. Confirmed against
 * superadmin's real ViewSets directly, not celiyohms's (web) assumptions.
 *
 * Distinct from `src/types/auth.ts` (the JWT/session shape derived from the
 * *signed-in* user's own token) — this is the shape of *other* staff records
 * an admin manages.
 */

export interface Role {
  id: string;
  tenant: string;
  name: string;
  description: string;
  /** Module→resource→action tree, e.g. {"crm": {"leads": {"view": "team"}}}. Not deeply validated server-side. */
  permissions: Record<string, unknown>;
  is_active: boolean;
  created_by: string | null;
  created_by_email: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * `CustomUser`. NOTE: no `department` field exists anywhere for non-doctor
 * staff, no `last_login` is serialized (DB column exists but isn't exposed),
 * and there is no "invited" status — only `is_active`. Don't add fake
 * placeholders for the first two; the UI reflects only what's real.
 */
export interface StaffUser {
  id: string;
  email: string;
  phone: string | null;
  first_name: string;
  last_name: string;
  tenant: string | null;
  tenant_name: string | null;
  roles: Role[];
  is_super_admin: boolean;
  profile_picture: string | null;
  timezone: string | null;
  preferences: Record<string, unknown> | null;
  is_active: boolean;
  date_joined: string;
}

/**
 * superadmin's list envelope — NOT the dghms-style `{success, count, ...}`
 * envelope (no `success` key here). Deliberately a distinct type from
 * `Paginated<T>` in `lib/api/hmsClient.ts`.
 */
export interface AdminPaginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** `POST /users` — a real password is required; no invite-email flow exists. Tenant is auto-forced server-side. */
export interface StaffCreatePayload {
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
  role_ids?: string[];
}

/** `PATCH /users/{id}` — `tenant`/`id`/`is_super_admin`/`date_joined` are read-only, not included here. */
export interface StaffUpdatePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_picture?: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
  is_active?: boolean;
  role_ids?: string[];
  /** Editable server-side, but there's no re-verification step — flag this in the UI. */
  email?: string;
}

export interface RoleCreatePayload {
  name: string;
  description?: string;
  permissions: Record<string, unknown>;
}

export type RoleUpdatePayload = Partial<RoleCreatePayload>;
