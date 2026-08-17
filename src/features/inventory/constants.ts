/**
 * Inventory module — display constants and formatting helpers over the real
 * dghms `/inventory/*` API. See src/types/inventory.ts for the verified
 * field contract.
 */
import type { Ionicons } from "@expo/vector-icons";
import type { ChipVariant } from "../../components/ui";
import type { InventoryTag, StockAlertType } from "../../types/inventory";

export const TAG_LABELS: Record<InventoryTag, string> = {
  opd: "OPD",
  ipd: "IPD",
  general: "General",
  pharmacy: "Pharmacy",
  surgical: "Surgical",
  lab: "Lab",
  other: "Other",
};

/** Client-side view filter — not a backend query param by itself. */
export type ListView = "all" | "low_stock" | "expiring_soon";

export const LIST_VIEW_OPTIONS: Array<{ id: ListView; label: string }> = [
  { id: "all", label: "All" },
  { id: "low_stock", label: "Low stock" },
  { id: "expiring_soon", label: "Expiring soon" },
];

export const ALERT_TYPE_LABELS: Record<StockAlertType, string> = {
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  expiry_approaching: "Expiry approaching",
  expired: "Expired",
  overstock: "Overstock",
};

export const ALERT_TYPE_CHIP_VARIANT: Record<StockAlertType, ChipVariant> = {
  low_stock: "warning",
  out_of_stock: "danger",
  expiry_approaching: "warning",
  expired: "danger",
  overstock: "info",
};

export const TRANSACTION_TINT: Record<string, "blue" | "emerald" | "amber" | "rose" | "violet" | "slate"> = {
  receive: "emerald",
  issue: "blue",
  adjustment_add: "amber",
  adjustment_remove: "amber",
  disposal: "rose",
  expired: "rose",
};

export const TRANSACTION_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  receive: "arrow-down-circle",
  issue: "arrow-up-circle",
  adjustment_add: "add-circle",
  adjustment_remove: "remove-circle",
  disposal: "trash",
  expired: "warning",
};

/** Format an INR (₹) amount, matching the Payments module's convention. */
export function formatINR(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "₹0";
  if (Number.isInteger(n)) return `₹${n.toLocaleString("en-IN")}`;
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "17 Aug 2026" display format for an ISO yyyy-mm-dd (or full datetime) string. */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** "17 Aug 2026, 10:12" for timestamps. */
export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${formatDate(date)}, ${hh}:${mm}`;
}

/** Days until expiry (negative if already expired). `null` when there's no expiry date. */
export function daysUntilExpiry(expiryDate: string | null | undefined, today: Date = new Date()): number | null {
  if (!expiryDate) return null;
  const target = new Date(expiryDate);
  if (Number.isNaN(target.getTime())) return null;
  const toDays = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
  return Math.round(toDays(target) - toDays(today));
}
