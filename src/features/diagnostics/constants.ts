/**
 * Lab / Diagnostics module — shared constants and display helpers.
 *
 * Module id is `diagnostics` (see `src/constants/modules.ts`); the drawer
 * label is "Lab" — screen/component names follow the drawer label.
 *
 * Real backend now wired (`src/lib/api/diagnosticOrders.ts`). No backend
 * state machine exists for `DiagnosticOrder.status` — `NEXT_ORDER_STATUS`
 * below is the client-side contract that keeps the UI forward-only.
 */

import type { ChipVariant } from "../../components/ui";
import type {
  DiagnosticOrderStatus,
  RequisitionPriority,
  ResultFlag,
} from "../../types/diagnostics";

export const ORDER_STATUS_LABELS: Record<DiagnosticOrderStatus, string> = {
  pending: "Pending",
  sample_collected: "Sample collected",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_CHIP_VARIANT: Record<DiagnosticOrderStatus, ChipVariant> = {
  pending: "neutral",
  sample_collected: "info",
  processing: "warning",
  completed: "success",
  cancelled: "danger",
};

/**
 * Forward-only progression. There is no backend enforcement — the "Advance"
 * action on the detail screen only ever offers the single next status listed
 * here, and never lets a user jump ahead or move backward. `null` means the
 * order is in a terminal state.
 */
export const NEXT_ORDER_STATUS: Record<DiagnosticOrderStatus, DiagnosticOrderStatus | null> = {
  pending: "sample_collected",
  sample_collected: "processing",
  processing: "completed",
  completed: null,
  cancelled: null,
};

/**
 * `id: "active"` maps to omitting the `status` query param entirely — per
 * the verified contract, that's the backend's own default and it already
 * excludes `completed`/`cancelled` (there's no single param that returns
 * literally everything, so this reads as "the working queue" rather than
 * an "All" that would be misleading).
 */
export const LAB_FILTER_OPTIONS: Array<{ id: "active" | DiagnosticOrderStatus; label: string }> = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "sample_collected", label: "Collected" },
  { id: "processing", label: "Processing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export const RESULT_FLAG_LABELS: Record<ResultFlag, string> = {
  normal: "Normal",
  low: "Low",
  high: "High",
  critical: "Critical",
};

export const RESULT_FLAG_CHIP_VARIANT: Record<ResultFlag, ChipVariant> = {
  normal: "success",
  low: "warning",
  high: "warning",
  critical: "danger",
};

export const PRIORITY_LABELS: Record<RequisitionPriority, string> = {
  routine: "Routine",
  urgent: "Urgent",
  stat: "STAT",
};

export const PRIORITY_CHIP_VARIANT: Record<RequisitionPriority, ChipVariant> = {
  routine: "neutral",
  urgent: "warning",
  stat: "danger",
};

/** The single `result_data` entry key used for a (test-level) DiagnosticOrder's report. */
export const RESULT_DATA_KEY = "result";

/** Compact display for an ISO datetime — "17 Aug · 10:42". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${d.getDate()} ${months[d.getMonth()]} · ${time}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
