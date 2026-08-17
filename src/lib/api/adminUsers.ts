/**
 * Superadmin (admin.celiyo.com) staff/role administration API — `/api/users/`
 * and `/api/roles/`. Calls go through `adminClient.ts`'s adminGet/adminPost/
 * adminPatch/adminDelete (bearer JWT, same as every other superadmin call in
 * this app) — never `hmsClient.ts`, which talks to a different backend.
 *
 * Mismatch found vs. the task brief: `adminClient.ts` currently attaches
 * only the bearer token, not tenant headers, even though
 * `getAuthRuntime().getTenantHeaders()` does exist (confirmed — same shape
 * `hmsClient.ts` uses: `{ tenantId, tenantSlug }`). The task's scope
 * boundary explicitly forbids editing `adminClient.ts` itself, so tenant
 * headers are attached per-request from here instead (each call below merges
 * them into its request config) rather than baked into the shared client.
 *
 * Also confirmed: despite being documented elsewhere, the real `/users` and
 * `/roles` ViewSets accept no search/filter/ordering query params — list-all
 * + client-side filtering (done in the screens) is intentional here, not a
 * shortcut.
 */
import type { AxiosRequestConfig } from "axios";
import { adminDelete, adminGet, adminPatch, adminPost } from "./adminClient";
import { getAuthRuntime } from "../auth/authRuntime";
import type {
  AdminPaginated,
  Role,
  RoleCreatePayload,
  RoleUpdatePayload,
  StaffCreatePayload,
  StaffUpdatePayload,
  StaffUser,
} from "../../types/admin";

function withTenantHeaders(config?: AxiosRequestConfig): AxiosRequestConfig {
  const { tenantId, tenantSlug } = getAuthRuntime().getTenantHeaders();
  const headers: Record<string, string> = { ...(config?.headers as Record<string, string> | undefined) };
  if (tenantId) headers["x-tenant-id"] = tenantId;
  if (tenantSlug) headers["x-tenant-slug"] = tenantSlug;
  return { ...config, headers };
}

// ─── Staff (CustomUser) ─────────────────────────────────────────────────

export function listStaff(): Promise<AdminPaginated<StaffUser>> {
  return adminGet<AdminPaginated<StaffUser>>("/users", withTenantHeaders());
}

export function getStaff(id: string): Promise<StaffUser> {
  return adminGet<StaffUser>(`/users/${id}`, withTenantHeaders());
}

export function createStaff(payload: StaffCreatePayload): Promise<StaffUser> {
  return adminPost<StaffUser, StaffCreatePayload>("/users", payload, withTenantHeaders());
}

export function updateStaff(id: string, payload: StaffUpdatePayload): Promise<StaffUser> {
  return adminPatch<StaffUser, StaffUpdatePayload>(`/users/${id}`, payload, withTenantHeaders());
}

/** Real unguarded hard delete — no active-session/last-admin check server-side. Prefer `updateStaff(id, {is_active:false})`. */
export function deleteStaff(id: string): Promise<void> {
  return adminDelete(`/users/${id}`, withTenantHeaders());
}

// ─── Roles ──────────────────────────────────────────────────────────────

export function listRoles(): Promise<AdminPaginated<Role>> {
  return adminGet<AdminPaginated<Role>>("/roles", withTenantHeaders());
}

export function createRole(payload: RoleCreatePayload): Promise<Role> {
  return adminPost<Role, RoleCreatePayload>("/roles", payload, withTenantHeaders());
}

export function updateRole(id: string, payload: RoleUpdatePayload): Promise<Role> {
  return adminPatch<Role, RoleUpdatePayload>(`/roles/${id}`, payload, withTenantHeaders());
}

/** No member-count guard server-side — same confirmation-dialog caution as `deleteStaff`. */
export function deleteRole(id: string): Promise<void> {
  return adminDelete(`/roles/${id}`, withTenantHeaders());
}

export function listRoleMembers(id: string): Promise<StaffUser[]> {
  return adminGet<StaffUser[]>(`/roles/${id}/members`, withTenantHeaders());
}
