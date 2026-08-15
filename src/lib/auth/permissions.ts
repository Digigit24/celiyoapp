/**
 * Ported as-is from celiyohms/src/lib/auth.ts — the permission contract is
 * backend-defined and must match the web app exactly.
 *
 * Only difference: decodeJWT uses a local base64url decoder because React
 * Native (Hermes) has no global `atob`.
 */
import type { JWTPayload } from "../../types/auth";

export type PrimaryRole =
  | "admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "cashier"
  | "pharmacist"
  | "lab_technician"
  | "staff";

const PRIMARY_ROLE_ORDER: PrimaryRole[] = [
  "doctor",
  "nurse",
  "receptionist",
  "cashier",
  "pharmacist",
  "lab_technician",
  "staff",
];

/**
 * Resolve the user's primary dashboard role from their roles list.
 * Admin and superusers are normalized to "admin" so they see all modules.
 */
export function getPrimaryRole(
  roles?: string[],
  isSuperAdmin?: boolean
): PrimaryRole | null {
  if (isSuperAdmin) return "admin";
  if (!roles) return null;

  const lowercaseRoles = roles.map((r) => r.toLowerCase());

  if (
    lowercaseRoles.includes("admin") ||
    lowercaseRoles.includes("superadmin") ||
    lowercaseRoles.includes("hospital_admin") ||
    lowercaseRoles.includes("hospitaladmin")
  ) {
    return "admin";
  }

  for (const role of PRIMARY_ROLE_ORDER) {
    if (lowercaseRoles.includes(role)) {
      return role;
    }
  }
  return null;
}

/** base64url → string, without relying on `atob` (absent in Hermes). */
function base64UrlDecode(input: string): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";

  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of base64) {
    if (ch === "=") break;
    const value = chars.indexOf(ch);
    if (value === -1) throw new Error("Invalid JWT token");
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  // Latin-1 string, then percent-decode as UTF-8 (same trick as celiyohms).
  const latin1 = bytes.map((b) => String.fromCharCode(b)).join("");
  return decodeURIComponent(
    latin1
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

export function decodeJWT(token: string): JWTPayload {
  const base64Url = token.split(".")[1];
  if (!base64Url) {
    throw new Error("Invalid JWT token");
  }
  return JSON.parse(base64UrlDecode(base64Url)) as JWTPayload;
}

export function isGrant(value: unknown): boolean {
  if (value === true) return true;
  if (value === "all" || value === "own") return true;
  // Legacy "team" is still treated as a grant during transition; plan to remove after
  // data migration once backend stops emitting it.
  if (value === "team") return true;
  // Legacy object shape: { enabled: true }
  if (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).enabled === true
  ) {
    return true;
  }
  return false;
}

function getPermissionValue(
  permissions: Record<string, unknown>,
  permission: string
): unknown {
  // Direct flat key match (e.g. "clinical.view_record")
  if (permission in permissions) {
    return permissions[permission];
  }

  // Nested dot-path: "hms.patients.view"
  const parts = permission.split(".");
  let current: unknown = permissions;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return null;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Check if a user has a specific permission.
 * Supports both flat ("clinical.view_record") and nested ({"hms":{"patients":{"view":true}}}) formats.
 *
 * Contract:
 * - true, "own", "all", and legacy "team" are treated as grants.
 * - admin.full_access.enabled is a wildcard that grants every admin.* and hms.* check.
 * - isSuperAdmin bypasses all checks.
 */
export function hasPermission(
  permissions: Record<string, unknown> | undefined,
  permission: string,
  isSuperAdmin?: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (!permissions) return false;

  if (isGrant(getPermissionValue(permissions, permission))) return true;

  // admin.full_access.enabled wildcard: grants every admin.* and hms.* check.
  const isWildcarded =
    (permission.startsWith("admin.") || permission.startsWith("hms.")) &&
    isGrant(getPermissionValue(permissions, "admin.full_access.enabled"));

  return isWildcarded;
}
