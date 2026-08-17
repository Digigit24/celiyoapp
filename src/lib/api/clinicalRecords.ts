/**
 * dghms Clinical Records browser API (`/api/clinical/records`) — a
 * cross-encounter, cross-patient index over records the live EMR engine
 * (`src/features/clinical/`) created. Read + lock/unlock/complete/delete
 * only; there is no create here (records are created from inside an
 * OPD/IPD encounter via the EMR engine).
 */
import { hmsDelete, hmsGet, hmsPost, type Paginated } from "./hmsClient";
import type { ClinicalRecordDetail, ClinicalRecordListItem } from "../../types/clinicalRecords";

export interface ClinicalRecordListParams {
  form?: number;
  encounter_type?: "opd_visit" | "ipd_admission";
  encounter_id?: number;
  occurrence_index?: number;
  status?: "in_progress" | "completed" | "locked";
  /** Optional — omitting it returns a tenant-wide list for staff callers. */
  patient_user_id?: string;
  search?: string;
  ordering?: "created_at" | "-created_at" | "updated_at" | "-updated_at" | "status" | "-status";
  page?: number;
  page_size?: number;
}

export function listClinicalRecords(params?: ClinicalRecordListParams) {
  return hmsGet<Paginated<ClinicalRecordListItem>>("/clinical/records", {
    params: { page_size: 30, ordering: "-created_at", ...params },
  });
}

export function getClinicalRecord(id: number) {
  return hmsGet<ClinicalRecordDetail>(`/clinical/records/${id}`);
}

export function lockClinicalRecord(id: number) {
  return hmsPost<ClinicalRecordDetail>(`/clinical/records/${id}/lock`);
}

export function unlockClinicalRecord(id: number) {
  return hmsPost<ClinicalRecordDetail>(`/clinical/records/${id}/unlock`);
}

export function completeClinicalRecord(id: number) {
  return hmsPost<ClinicalRecordDetail>(`/clinical/records/${id}/complete`);
}

/** Hard delete — permitted only when unlocked (403 if locked); no soft-delete. */
export function deleteClinicalRecord(id: number) {
  return hmsDelete(`/clinical/records/${id}`);
}
