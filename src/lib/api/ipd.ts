/**
 * dghms IPD Admission API (/api/ipd/admissions/*).
 * Endpoint names/paths corrected against apps/ipd/views.py — several dghms
 * docs are stale (e.g. billing lives at /ipd/billings/, not /ipd-bills/;
 * see the plan's "Corrections" note). Ward/bed reads live in hooks/masters.ts.
 */
import { hmsDelete, hmsGet, hmsPatch, hmsPost, type Paginated } from "./hmsClient";
import type {
  AdmissionCreatePayload,
  AdmissionDetail,
  AdmissionListItem,
  BedTransfer,
  BillItemCreatePayload,
  DischargePacket,
  DischargePayload,
  IPDBilling,
  IPDBillItem,
  IPDBillTemplate,
  IPDStats,
  RegistrationData,
  RegistrationPatchPayload,
} from "../../types/ipd";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AdmissionListParams {
  search?: string;
  status?: string;
  admission_type?: string;
  ward?: string;
  doctor_id?: string;
  patient?: number;
  claim_status?: string;
  /** Sent for parity with celiyohms, though AdmissionFilter may not honor it server-side. */
  payment_status?: string;
  admission_date__gte?: string;
  admission_date__lte?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export function listAdmissions(params?: AdmissionListParams) {
  return hmsGet<Paginated<AdmissionListItem>>("/ipd/admissions", {
    params: { page_size: 50, ...params },
  });
}

export function getAdmission(id: number) {
  return hmsGet<AdmissionDetail>(`/ipd/admissions/${id}`);
}

export function createAdmission(payload: AdmissionCreatePayload) {
  return hmsPost<AdmissionDetail>("/ipd/admissions", payload);
}

export function updateAdmission(id: number, payload: Partial<AdmissionCreatePayload>) {
  return hmsPatch<AdmissionDetail>(`/ipd/admissions/${id}`, payload);
}

/** Unwrapped — apps/ipd/views.py's GET handler returns the payload directly. */
export function getRegistration(id: number) {
  return hmsGet<RegistrationData>(`/ipd/admissions/${id}/registration`);
}

/** Wrapped {success,message,data} — apps/ipd/views.py's PATCH handler uses action_response(). */
export function updateRegistration(id: number, payload: RegistrationPatchPayload) {
  return hmsPatch<Envelope<RegistrationData>>(`/ipd/admissions/${id}/registration`, payload).then(
    (r) => r.data
  );
}

export function dischargeAdmission(id: number, payload: DischargePayload) {
  return hmsPost<AdmissionDetail>(`/ipd/admissions/${id}/discharge`, payload);
}

export function getActiveAdmissions() {
  return hmsGet<Envelope<AdmissionListItem[]>>("/ipd/admissions/active").then(
    (r) => r.data
  );
}

export function getAdmissionStatistics(params?: { date_from?: string; date_to?: string }) {
  return hmsGet<{ success: boolean; date_from: string | null; date_to: string | null; data: IPDStats }>(
    "/ipd/admissions/statistics",
    { params }
  ).then((r) => r.data);
}

// ─── Bed transfers ──────────────────────────────────────────────────────

export function listBedTransfers(admissionId: number) {
  return hmsGet<Paginated<BedTransfer>>("/ipd/bed-transfers", {
    params: { admission: admissionId, page_size: 100 },
  }).then((r) => r.results);
}

export function createBedTransfer(payload: {
  admission: number;
  from_bed: string;
  to_bed: string;
  reason?: string;
}) {
  return hmsPost<BedTransfer>("/ipd/bed-transfers", payload);
}

// ─── Discharge packet ───────────────────────────────────────────────────

/** Unwrapped on GET, wrapped {success,message,data} on PATCH — matches the registration split. */
export function getDischargePacket(admissionId: number) {
  return hmsGet<DischargePacket>(`/ipd/admissions/${admissionId}/discharge-packet`);
}

export function updateDischargePacket(
  admissionId: number,
  payload: { narrative?: string; approved?: boolean }
) {
  return hmsPatch<Envelope<DischargePacket>>(
    `/ipd/admissions/${admissionId}/discharge-packet`,
    payload
  ).then((r) => r.data);
}

export function generateDischargePacket(admissionId: number) {
  return hmsPost<DischargePacket>(`/ipd/admissions/${admissionId}/discharge-packet/generate`);
}

// ─── Billing ────────────────────────────────────────────────────────────

export function listBills(admissionId: number) {
  return hmsGet<Paginated<IPDBilling>>("/ipd/billings", {
    params: { admission: admissionId, page_size: 50 },
  }).then((r) => r.results);
}

export function createBill(admissionId: number) {
  return hmsPost<IPDBilling>("/ipd/billings", { admission: admissionId });
}

export function updateBill(id: number, payload: { discount_percent?: number }) {
  return hmsPatch<IPDBilling>(`/ipd/billings/${id}`, payload);
}

export function addBedCharges(id: number) {
  return hmsPost<IPDBilling>(`/ipd/billings/${id}/add_bed_charges`);
}

export function addPayment(
  id: number,
  payload: { amount: number; payment_mode: string; notes?: string }
) {
  return hmsPost<Envelope<IPDBilling>>(`/ipd/billings/${id}/add_payment`, payload).then(
    (r) => r.data
  );
}

export function createBillItem(payload: BillItemCreatePayload) {
  return hmsPost<IPDBillItem>("/ipd/bill-items", payload);
}

export function updateBillItem(id: number, payload: Partial<BillItemCreatePayload>) {
  return hmsPatch<IPDBillItem>(`/ipd/bill-items/${id}`, payload);
}

export function deleteBillItem(id: number) {
  return hmsDelete(`/ipd/bill-items/${id}`);
}

export function listBillTemplates(search?: string) {
  return hmsGet<Paginated<IPDBillTemplate>>("/ipd/bill-templates", {
    params: { page_size: 50, ...(search ? { search } : {}) },
  }).then((r) => r.results);
}

export function createBillTemplateFromBill(bill: number, name: string, description?: string) {
  return hmsPost<Record<string, unknown>>("/ipd/bill-templates/from_bill", {
    bill,
    name,
    description,
  });
}

export function applyBillTemplate(templateId: number, bill: number) {
  return hmsPost<Record<string, unknown>>(`/ipd/bill-templates/${templateId}/apply`, { bill });
}
