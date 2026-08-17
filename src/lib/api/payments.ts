/** Unified bill-payment ledger (/api/payments/*, apps.payments). */
import { hmsDelete, hmsGet, hmsPatch, hmsPost, type Paginated } from "./hmsClient";
import type { BillPayment } from "../../types/ipd";
import type {
  Payment,
  PaymentCreatePayload,
  PaymentListParams,
  PaymentStats,
  PaymentStatsParams,
  PaymentUpdatePayload,
} from "../../types/payments";

export function listBillPayments(ipdBillId: number) {
  return hmsGet<Paginated<BillPayment>>("/payments/bill-payments", {
    params: { ipd_bill: ipdBillId, page_size: 100 },
  }).then((r) => r.results);
}

export function listOpdBillPayments(opdBillId: number) {
  return hmsGet<Paginated<BillPayment>>("/payments/bill-payments", {
    params: { opd_bill: opdBillId, page_size: 100 },
  }).then((r) => r.results);
}

// ─── Payments module (module-wide CRUD) ────────────────────────────────────
// Everything below talks to the same `/payments/bill-payments` ModelViewSet
// as the two scoped helpers above, but drives the standalone Payments
// feature (list/detail/create/edit/delete across OPD+IPD+Daycare bills, plus
// the aggregate stats endpoint).

interface StatsEnvelope {
  success: boolean;
  data: PaymentStats;
}

export function listPayments(params?: PaymentListParams) {
  return hmsGet<Paginated<Payment>>("/payments/bill-payments", {
    params: { page_size: 20, ...params },
  });
}

export function getPayment(id: string) {
  return hmsGet<Payment>(`/payments/bill-payments/${id}`);
}

export function getPaymentStats(params?: PaymentStatsParams) {
  return hmsGet<StatsEnvelope>("/payments/bill-payments/stats", { params }).then(
    (r) => r.data
  );
}

export function createPayment(payload: PaymentCreatePayload) {
  return hmsPost<Payment>("/payments/bill-payments", payload);
}

export function updatePayment(id: string, payload: PaymentUpdatePayload) {
  return hmsPatch<Payment>(`/payments/bill-payments/${id}`, payload);
}

export function deletePayment(id: string) {
  return hmsDelete(`/payments/bill-payments/${id}`);
}
