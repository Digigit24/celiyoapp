/**
 * Pharmacy module — display constants and formatting helpers over the real
 * dghms `/pharmacy/prescriptions` API. See src/types/pharmacy.ts for the
 * verified field contract.
 */
import type { ChipVariant } from "../../components/ui";
import type { PrescriptionStatus } from "../../types/pharmacy";

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  pending: "Pending",
  partially_dispensed: "Partially dispensed",
  dispensed: "Dispensed",
  cancelled: "Cancelled",
};

export const PRESCRIPTION_STATUS_CHIP_VARIANT: Record<PrescriptionStatus, ChipVariant> = {
  pending: "warning",
  partially_dispensed: "info",
  dispensed: "success",
  cancelled: "danger",
};

export const PHARMACY_FILTER_OPTIONS: Array<{ id: "all" | PrescriptionStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "partially_dispensed", label: "Partial" },
  { id: "dispensed", label: "Dispensed" },
  { id: "cancelled", label: "Cancelled" },
];

/** "17 Aug 2026, 10:12" from an ISO datetime string. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/** Short "17 Aug" form for list rows. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/** A short line describing the encounter this prescription is linked to. */
export function describeEncounter(label: string, encounterId: number | null): string {
  if (!label) return encounterId ? `#${encounterId}` : "—";
  return encounterId ? `${label} #${encounterId}` : label;
}
