/**
 * dghms diagnostic order/requisition/report workflow
 * (`/api/diagnostics/requisitions`, `/orders`, `/reports`, `/ranges`).
 *
 * Separate from `./diagnostics.ts` (the investigation master-catalogue
 * search used by the clinical form's investigation-grid field) — that file
 * is untouched.
 *
 * Verified contract highlights:
 *  - No backend state-machine on `DiagnosticOrder.status` — callers must
 *    enforce forward-only progression themselves (see
 *    `features/diagnostics/constants.ts`).
 *  - Creating a `LabReport` flips the order (and requisition, if complete)
 *    to `completed` via a backend signal — never PATCH status after
 *    `createLabReport`.
 *  - "Verify" a report is a plain PATCH with a client-supplied
 *    `verified_by`/`verified_at` — there's no dedicated verify action.
 */
import { hmsDelete, hmsGet, hmsPatch, hmsPost, type Paginated } from "./hmsClient";
import type {
  DiagnosticOrder,
  DiagnosticOrderStatus,
  DiagnosticsEncounterType,
  InvestigationRange,
  LabReport,
  LabReportCreatePayload,
  Requisition,
  RequisitionCreatePayload,
} from "../../types/diagnostics";

// ─── Orders (test-level, queue view) ───────────────────────────────────────

export interface OrderListParams {
  status?: DiagnosticOrderStatus;
  patient?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

export function listLabDashboard(params?: OrderListParams) {
  return hmsGet<Paginated<DiagnosticOrder>>("/diagnostics/orders/lab-dashboard", {
    params: { page_size: 30, ...params },
  });
}

export function getOrder(id: number) {
  return hmsGet<DiagnosticOrder>(`/diagnostics/orders/${id}`);
}

export function getOrderByEncounter(encounterType: DiagnosticsEncounterType, encounterId: number) {
  return hmsGet<Paginated<DiagnosticOrder> | DiagnosticOrder[]>("/diagnostics/orders/by-encounter", {
    params: { encounter_type: encounterType, encounter_id: encounterId },
  });
}

/** Generic partial PATCH — lets a single call move status and set sample_id together. */
export function patchOrder(
  id: number,
  payload: Partial<{ status: DiagnosticOrderStatus; sample_id: string }>
) {
  return hmsPatch<DiagnosticOrder>(`/diagnostics/orders/${id}`, payload);
}

export function updateOrderStatus(id: number, status: DiagnosticOrderStatus) {
  return patchOrder(id, { status });
}

export function setOrderSampleId(id: number, sampleId: string) {
  return patchOrder(id, { sample_id: sampleId });
}

/** Collect-sample step: records the sample id and advances status in one PATCH. */
export function collectSample(id: number, sampleId: string) {
  return patchOrder(id, { sample_id: sampleId, status: "sample_collected" });
}

export function cancelOrder(id: number) {
  return updateOrderStatus(id, "cancelled");
}

export function deleteOrder(id: number) {
  return hmsDelete(`/diagnostics/orders/${id}`);
}

// ─── Requisitions (order-level, multi-test) ────────────────────────────────

export interface RequisitionListParams {
  status?: string;
  patient?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

export function listRequisitions(params?: RequisitionListParams) {
  return hmsGet<Paginated<Requisition>>("/diagnostics/requisitions", {
    params: { page_size: 30, ...params },
  });
}

export function getRequisition(id: number) {
  return hmsGet<Requisition>(`/diagnostics/requisitions/${id}`);
}

export function createRequisition(payload: RequisitionCreatePayload) {
  return hmsPost<Requisition>("/diagnostics/requisitions", payload);
}

export function updateRequisitionStatus(id: number, status: Requisition["status"]) {
  return hmsPatch<Requisition>(`/diagnostics/requisitions/${id}`, { status });
}

/**
 * Cancel a requisition and (best-effort) cascade the cancellation to each
 * child order — the backend does not cascade automatically.
 */
export async function cancelRequisitionCascade(requisition: Requisition) {
  await updateRequisitionStatus(requisition.id, "cancelled");
  await Promise.all(
    requisition.investigation_orders
      .filter((order) => order.status !== "cancelled" && order.status !== "completed")
      .map((order) => cancelOrder(order.id))
  );
}

// ─── Reference ranges ───────────────────────────────────────────────────────

export function listInvestigationRanges(investigationId: number) {
  return hmsGet<Paginated<InvestigationRange> | InvestigationRange[]>("/diagnostics/ranges", {
    params: { investigation: investigationId },
  });
}

// ─── Reports ────────────────────────────────────────────────────────────────

/**
 * Not explicitly named in the verified contract (which only documents the
 * POST/PATCH actions), but `/diagnostics/reports` is a standard
 * ModelViewSet-style resource like every other endpoint here, so a filtered
 * list is a safe, low-risk inference for "does this order already have a
 * report" — used to show/verify an existing report instead of re-POSTing.
 */
export function listLabReportsForOrder(orderId: number) {
  return hmsGet<Paginated<LabReport>>("/diagnostics/reports", {
    params: { diagnostic_order: orderId, page_size: 5 },
  });
}

export function createLabReport(payload: LabReportCreatePayload) {
  const form = new FormData();
  form.append("diagnostic_order", String(payload.diagnostic_order));
  form.append("result_data", JSON.stringify(payload.result_data));
  if (payload.technician_id) form.append("technician_id", payload.technician_id);
  if (payload.attachment) {
    // React Native's FormData accepts this {uri,name,type} shape directly — not a real Blob/File.
    form.append("attachment", {
      uri: payload.attachment.uri,
      name: payload.attachment.name,
      type: payload.attachment.mimeType,
    } as unknown as Blob);
  }

  return hmsPost<LabReport>("/diagnostics/reports", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function verifyLabReport(id: number, verifiedByUserId: string) {
  return hmsPatch<LabReport>(`/diagnostics/reports/${id}`, {
    verified_by: verifiedByUserId,
    verified_at: new Date().toISOString(),
  });
}
