/**
 * Daycare module — shared constants.
 *
 * There is no separate Daycare backend concept: a daycare "session" is a
 * dghms IPD `Admission` row with `admission_type: "daycare"` (see
 * `/api/ipd/admissions`, apps/ipd). It shares `AdmissionListItem`/
 * `AdmissionDetail` from `types/ipd.ts` verbatim — no separate session type,
 * vitals snapshot, or timeline exists on the model. Status values are the
 * same `Admission.STATUS_CHOICES` as regular IPD (`admitted, discharged,
 * transferred, absconded, referred, death`) — there is no separate
 * scheduled/in-progress/completed/cancelled daycare status.
 *
 * The one real business rule specific to daycare: the backend requires the
 * discharge date to fall on the same calendar day as the admission date
 * (raises a `ValueError` otherwise) — `isSameDayAsAdmission` below lets the
 * UI surface that as a friendly validation message instead of a raw error.
 */
import type { ChipVariant } from "../../components/ui";
import type { AdmissionStatus } from "../../types/ipd";
import { ADMISSION_STATUS_ACCENT, ADMISSION_STATUS_VARIANT } from "../ipd/constants";

export { ADMISSION_STATUS_ACCENT, ADMISSION_STATUS_VARIANT };

export const DAYCARE_STATUS_LABELS: Record<AdmissionStatus, string> = {
  admitted: "Checked in",
  discharged: "Discharged",
  transferred: "Transferred",
  absconded: "Absconded",
  referred: "Referred",
  death: "Deceased",
};

export const DAYCARE_FILTER_OPTIONS: Array<{ id: "all" | AdmissionStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "admitted", label: "Checked in" },
  { id: "discharged", label: "Discharged" },
];

/** Unused directly here but kept re-exported for chip-variant callers that want it typed. */
export type DaycareChipVariant = ChipVariant;

/** Compact display label for an ISO yyyy-mm-dd date — "17 Aug 2026". */
export function formatDaycareDate(date: string | null | undefined): string {
  if (!date) return "—";
  const [datePart] = date.split("T");
  const [y, m, d] = datePart.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = months[m - 1] ?? "—";
  return `${d} ${label} ${y}`;
}

/** True when `dateIso` (any ISO date/datetime string) falls on today's calendar date, local time. */
export function isToday(dateIso: string | null | undefined): boolean {
  if (!dateIso) return false;
  const d = new Date(dateIso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Mirrors the backend's daycare business rule client-side: daycare
 * admissions must be discharged on the same calendar day they were admitted.
 * Returns an error message when discharging now would violate that, or
 * `null` when it's fine to proceed.
 */
export function daycareDischargeValidationError(admissionDateIso: string): string | null {
  if (!isToday(admissionDateIso)) {
    return "Daycare admissions must be discharged the same day they were admitted. This session was admitted on a different day and can no longer be discharged as daycare.";
  }
  return null;
}

/** Today's date as YYYY-MM-DD, for defaulting the admission_date field. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
