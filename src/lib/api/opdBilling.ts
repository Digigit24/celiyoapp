/**
 * dghms OPD Billing (/api/opd/opd-bills/, /api/opd/opd-bill-items/) —
 * multiple independent bills per visit, same shape/flow as IPD billing
 * (src/lib/api/ipd.ts's billing functions) just pointed at these endpoints.
 */
import { hmsDelete, hmsGet, hmsPatch, hmsPost, type Paginated } from "./hmsClient";
import type { OPDBill, OPDBillItem, OpdBillItemCreatePayload, OpdType, ChargeType } from "../../types/opd";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export function listOpdBills(visitId: number) {
  return hmsGet<Paginated<OPDBill>>("/opd/opd-bills", {
    params: { visit: visitId, page_size: 50 },
  }).then((r) => r.results);
}

export function createOpdBill(
  visitId: number,
  payload?: { doctor?: number; opd_type?: OpdType; charge_type?: ChargeType }
) {
  return hmsPost<OPDBill>("/opd/opd-bills", {
    visit: visitId,
    opd_type: payload?.opd_type ?? "consultation",
    charge_type: payload?.charge_type ?? "first_visit",
    doctor: payload?.doctor,
  });
}

export function updateOpdBill(id: number, payload: { discount_percent?: number }) {
  return hmsPatch<OPDBill>(`/opd/opd-bills/${id}`, payload);
}

export function recordOpdPayment(
  id: number,
  payload: { amount: number; payment_mode: string; notes?: string }
) {
  return hmsPost<Envelope<OPDBill>>(`/opd/opd-bills/${id}/record_payment`, payload).then(
    (r) => r.data
  );
}

export function createOpdBillItem(payload: OpdBillItemCreatePayload) {
  return hmsPost<OPDBillItem>("/opd/opd-bill-items", payload);
}

export function updateOpdBillItem(id: number, payload: Partial<OpdBillItemCreatePayload>) {
  return hmsPatch<OPDBillItem>(`/opd/opd-bill-items/${id}`, payload);
}

export function deleteOpdBillItem(id: number) {
  return hmsDelete(`/opd/opd-bill-items/${id}`);
}
