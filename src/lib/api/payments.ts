/** Unified bill-payment ledger (/api/payments/*, apps.payments). */
import { hmsGet, type Paginated } from "./hmsClient";
import type { BillPayment } from "../../types/ipd";

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
