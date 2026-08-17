/**
 * Types for dghms's diagnostic order/requisition/report workflow
 * (`/api/diagnostics/requisitions`, `/orders`, `/reports`, `/ranges`).
 *
 * Distinct from `src/lib/api/diagnostics.ts`'s `InvestigationOption` (the
 * master test catalogue used by the clinical form's investigation-grid
 * field) — this file covers the lab order/collect-sample/result-entry
 * workflow, which that file doesn't touch.
 *
 * Two load-bearing quirks called out explicitly because they're easy to get
 * wrong:
 *  - `DiagnosticOrder.status` has 5 values (`pending|sample_collected|
 *    processing|completed|cancelled`) — NOT the `ordered|in-progress|
 *    reported` enum the old mock invented.
 *  - There is NO backend state-machine enforcement on status transitions —
 *    the UI (see `features/diagnostics/constants.ts`'s
 *    `NEXT_ORDER_STATUS`) is the only thing stopping a forward-only jump.
 */

export type DiagnosticOrderStatus =
  | "pending"
  | "sample_collected"
  | "processing"
  | "completed"
  | "cancelled";

export type RequisitionStatus = "ordered" | "sample_collected" | "completed" | "cancelled";

export type RequisitionPriority = "routine" | "urgent" | "stat";

/** dghms encounter_type values as used by the diagnostics app specifically — dotted, unlike clinical-records' underscore form. */
export type DiagnosticsEncounterType = "opd.visit" | "ipd.admission";

/** Row shape returned by `GET /diagnostics/orders/lab-dashboard` and `/orders/{id}`. */
export interface DiagnosticOrder {
  id: number;
  requisition: number;
  investigation: number;
  investigation_name: string;
  patient: number;
  patient_name: string;
  patient_mobile: string;
  patient_email: string | null;
  status: DiagnosticOrderStatus;
  sample_id: string | null;
  price: string;
  created_at: string;
  updated_at: string;
  /** Present only on the richer `by-encounter` / detail responses. */
  lab_report?: LabReport | null;
}

export interface Requisition {
  id: number;
  requisition_number: string;
  requisition_type: string;
  patient: number;
  patient_name: string;
  requesting_doctor_id: string | null;
  status: RequisitionStatus;
  priority: RequisitionPriority;
  order_date: string;
  clinical_notes: string | null;
  investigation_orders: DiagnosticOrder[];
  created_at: string;
  updated_at: string;
}

export interface RequisitionCreatePayload {
  requisition_type: "investigation";
  patient: number;
  requesting_doctor_id?: string;
  priority?: RequisitionPriority;
  clinical_notes?: string;
  encounter_type: DiagnosticsEncounterType;
  encounter_id: number;
  investigation_ids: number[];
}

/**
 * `result_data` has zero backend schema — this is our invented client-side
 * convention: one entry per test line. For a single-test DiagnosticOrder
 * this is just one entry keyed by the investigation code/name; kept as a
 * record so a multi-parameter panel could still be represented if ever
 * needed.
 */
export interface ResultDataEntry {
  value: string | number;
  unit?: string;
  flag?: ResultFlag;
  notes?: string;
}

export type ResultData = Record<string, ResultDataEntry>;

export type ResultFlag = "normal" | "low" | "high" | "critical";

export interface LabReport {
  id: number;
  diagnostic_order: number;
  result_data: ResultData;
  attachment: string | null;
  technician_id: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabReportCreatePayload {
  diagnostic_order: number;
  result_data: ResultData;
  attachment?: { uri: string; name: string; mimeType: string };
  technician_id?: string;
}

/**
 * Field names are best-effort — the contract only names the endpoint
 * (`GET /diagnostics/ranges?investigation={id}`) and says "no age/gender
 * auto-matching server-side, just show all matching rows or the first
 * one", not the exact serializer fields. `listInvestigationRanges` in
 * `lib/api/diagnosticOrders.ts` tolerates missing/renamed fields defensively
 * (falls back to `normal_range_text` / a generic min-max render) so a field
 * name mismatch degrades gracefully instead of crashing the result-entry
 * screen — but if the real shape differs, this is the type to fix first.
 */
export interface InvestigationRange {
  id: number;
  investigation: number;
  gender: string | null;
  age_min: number | null;
  age_max: number | null;
  min_value: string | null;
  max_value: string | null;
  unit: string | null;
  normal_range_text: string | null;
}
