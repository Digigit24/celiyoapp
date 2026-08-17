/**
 * Admin (staff administration) module — shared display helpers.
 *
 * Wired against the real superadmin `/api/users/` + `/api/roles/` backend
 * (`src/lib/api/adminUsers.ts`, `src/types/admin.ts`) — a different backend
 * than every other module in this app (see CLAUDE.md's "Backends" section).
 * Distinct from `src/features/settings/` (self-service settings for the
 * signed-in user's own preferences); Admin manages OTHER staff accounts.
 */
import type { ChipVariant } from "../../components/ui";

export type StaffStatusFilter = "all" | "active" | "inactive";

export const STAFF_STATUS_LABELS: Record<"active" | "inactive", string> = {
  active: "Active",
  inactive: "Inactive",
};

export const STAFF_STATUS_CHIP_VARIANT: Record<"active" | "inactive", ChipVariant> = {
  active: "success",
  inactive: "neutral",
};

export const STAFF_FILTER_OPTIONS: Array<{ id: StaffStatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

/** Display name — falls back to the email local-part when both name fields are blank. */
export function staffDisplayName(staff: { first_name: string; last_name: string; email: string }): string {
  const name = [staff.first_name, staff.last_name].filter(Boolean).join(" ").trim();
  if (name.length > 0) return name;
  return staff.email.split("@")[0] ?? staff.email;
}

/** "17 Aug 2026" display for an ISO date/datetime string. Returns "—" if unparseable. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** "3y 2m" style tenure string from an ISO join date to now. */
export function formatTenure(joinedDate: string | null | undefined): string {
  if (!joinedDate) return "—";
  const joined = new Date(joinedDate);
  if (Number.isNaN(joined.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - joined.getFullYear();
  let months = now.getMonth() - joined.getMonth();
  if (now.getDate() < joined.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return "New";
  if (years <= 0) return `${months}m`;
  return `${years}y ${months}m`;
}

/** Generates a readable-but-random password meeting typical complexity rules, for the "generate" helper in the create form. */
export function generatePassword(length = 14): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;

  function pick(pool: string): string {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => pick(all));
  const chars = [...required, ...rest];

  // Fisher-Yates shuffle so the required chars aren't always in the first 4 slots.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
