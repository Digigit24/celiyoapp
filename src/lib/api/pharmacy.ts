/**
 * dghms Pharmacy API (/api/pharmacy/prescriptions/*). Endpoint names/shapes
 * confirmed against apps/pharmacy source — see src/types/pharmacy.ts for the
 * full contract notes (esp. the missing dispensed_quantity/is_dispensed
 * fields).
 *
 * NOT to be confused with src/hooks/masters.ts's `/pharmacy/products` calls
 * (a separate sale-catalog resource, left untouched).
 */
import { hmsDelete, hmsGet, hmsPost, type Paginated } from "./hmsClient";
import type {
  AddPrescriptionItemPayload,
  DispensePayload,
  DispenseResult,
  EncounterTypeAlias,
  Prescription,
  PrescriptionCreatePayload,
  PrescriptionStatus,
  UpdatePrescriptionItemPayload,
} from "../../types/pharmacy";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PrescriptionListParams {
  visit?: number;
  status?: PrescriptionStatus;
  encounter_type?: EncounterTypeAlias;
  encounter_id?: number;
  patient?: number;
  /** Patient name/mobile only — does NOT search drug names. */
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export function listPrescriptions(params?: PrescriptionListParams) {
  return hmsGet<Paginated<Prescription>>("/pharmacy/prescriptions", {
    params: { page_size: 20, ordering: "-created_at", ...params },
  });
}

export function getPrescription(id: number) {
  return hmsGet<Prescription>(`/pharmacy/prescriptions/${id}`);
}

/** Items can't be included inline — create the prescription, then add_item per line. */
export function createPrescription(payload: PrescriptionCreatePayload) {
  return hmsPost<Prescription>("/pharmacy/prescriptions", payload);
}

/**
 * Works unconditionally — even post-dispense (a real backend gap, not ours to
 * fix). Callers must confirm first; this module doesn't gate it further.
 */
export function deletePrescription(id: number) {
  return hmsDelete(`/pharmacy/prescriptions/${id}`);
}

/**
 * These three actions' response envelopes aren't spelled out in the verified
 * contract beyond "same fields as list/detail never include dispensed_*".
 * Modeled on this codebase's other custom @action endpoints (e.g.
 * opdBilling's record_payment): `{success, message, data: <updated parent>}`.
 * Callers invalidate the prescription-detail query afterward regardless, so
 * a mismatch here degrades to an extra refetch, not incorrect UI state.
 */
export function addPrescriptionItem(id: number, payload: AddPrescriptionItemPayload) {
  return hmsPost<Envelope<Prescription>>(`/pharmacy/prescriptions/${id}/add_item`, payload);
}

export function updatePrescriptionItem(id: number, payload: UpdatePrescriptionItemPayload) {
  return hmsPost<Envelope<Prescription>>(`/pharmacy/prescriptions/${id}/update_item`, payload);
}

export function removePrescriptionItem(id: number, itemId: number) {
  return hmsPost<Envelope<Prescription>>(`/pharmacy/prescriptions/${id}/remove_item`, {
    item_id: itemId,
  });
}

/**
 * Omit `item_id` to dispense all pending items. 422 if ALL items fail
 * (e.g. insufficient stock); 200 with partial `data.errors[]` otherwise.
 */
export function dispensePrescription(id: number, payload?: DispensePayload) {
  return hmsPost<DispenseResult>(`/pharmacy/prescriptions/${id}/dispense`, payload ?? {});
}
