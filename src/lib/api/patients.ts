/**
 * dghms PatientProfile API (/api/patients/*). Search/view plus inline
 * creation from New Visit / New Admission — full patient-management CRUD
 * (editing existing patients, vitals, allergies) stays web-only.
 *
 * The list endpoint's envelope wasn't confirmed as the standard
 * {count,next,previous,results} shape during research (PatientProfileViewSet
 * overrides list() and may instead return {success,data}) — decode
 * defensively for either shape.
 */
import { hmsGet, hmsPost, type Paginated } from "./hmsClient";
import type { PatientCreatePayload, PatientDetail, PatientListItem } from "../../types/patients";

interface DataEnvelope<T> {
  success: boolean;
  data: T;
}

export interface PatientListParams {
  search?: string;
  status?: string;
  gender?: string;
  blood_group?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

function unwrapList<T>(res: Paginated<T> | DataEnvelope<T[]>): T[] {
  return "results" in res ? res.results : res.data;
}

export async function listPatients(params?: PatientListParams): Promise<PatientListItem[]> {
  const res = await hmsGet<Paginated<PatientListItem> | DataEnvelope<PatientListItem[]>>(
    "/patients/profiles",
    { params: { page_size: 25, ...params } }
  );
  return unwrapList(res);
}

export function getPatient(id: number) {
  return hmsGet<DataEnvelope<PatientDetail>>(`/patients/profiles/${id}`).then(
    (r) => r.data
  );
}

export function createPatient(payload: PatientCreatePayload) {
  return hmsPost<PatientDetail>("/patients/profiles", { country: "India", ...payload });
}
