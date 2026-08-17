/**
 * Types for dghms's unified bill-payment ledger (`/api/payments/bill-payments/*`,
 * apps.payments). Confirmed against apps/payments — this is the single source
 * of truth for payment records across OPD, IPD, and Daycare (there is no
 * separate per-module payments table).
 *
 * There is NO `status` field, timeline, breakdown lines, or gateway ref on
 * this model — a payment row simply exists once created. `receipt_number`,
 * `payment_group_id`, `id`, `tenant_id`, `created_at`, `updated_at` are
 * server-set; never send them on create/update.
 */

export type PaymentBillType = "opd" | "ipd" | "daycare";

export type PaymentMode =
  | "cash"
  | "card"
  | "upi"
  | "bank"
  | "online"
  | "insurance"
  | "cheque"
  | "razorpay"
  | "multiple"
  | "other";

/** List & detail share the exact same fields. */
export interface Payment {
  id: string;
  tenant_id: string;
  bill_type: PaymentBillType;
  bill_type_label: string;
  opd_bill: number | null;
  ipd_bill: number | null;
  bill_number: string | null;
  patient_name: string | null;
  encounter_number: string | null;
  amount: string;
  payment_mode: PaymentMode;
  payment_mode_label: string;
  payment_group_id: string | null;
  receipt_number: string | null;
  payment_date: string;
  notes: string | null;
  recorded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentListParams {
  bill_type?: PaymentBillType;
  payment_mode?: PaymentMode;
  /** Exact-day filter only (YYYY-MM-DD) — no range filtering on this endpoint. */
  payment_date?: string;
  opd_bill?: number;
  ipd_bill?: number;
  ordering?: "payment_date" | "-payment_date" | "amount" | "-amount" | "created_at" | "-created_at";
  page?: number;
  page_size?: number;
}

/**
 * `bill_type` is NOT auto-derived from `opd_bill`/`ipd_bill` server-side —
 * always send it explicitly. A freestanding payment with no bill reference
 * is valid (omit both `opd_bill` and `ipd_bill`).
 */
export interface PaymentCreatePayload {
  bill_type: PaymentBillType;
  /** String decimal, e.g. "1250.00". */
  amount: string;
  opd_bill?: number;
  ipd_bill?: number;
  bill_number?: string;
  patient_name?: string;
  encounter_number?: string;
  payment_mode?: PaymentMode;
  /** YYYY-MM-DD — defaults to today server-side when omitted. */
  payment_date?: string;
  notes?: string;
}

/**
 * Update intentionally excludes `bill_type`/`opd_bill`/`ipd_bill` — the API
 * technically allows re-linking a payment to a different bill, but that's a
 * bad UX for a settled financial record, so the app never sends it.
 */
export interface PaymentUpdatePayload {
  amount?: string;
  payment_mode?: PaymentMode;
  payment_date?: string;
  notes?: string;
}

export interface PaymentStatsByMode {
  payment_mode: PaymentMode;
  count: number;
  total: string;
}

export interface PaymentStatsByType {
  bill_type: PaymentBillType;
  count: number;
  total: string;
}

export interface PaymentDailyTrendPoint {
  date: string;
  total: string;
  count: number;
}

export interface PaymentStats {
  total_collected: string;
  transaction_count: number;
  collected_today: string;
  count_today: number;
  collected_this_week: string;
  collected_this_month: string;
  by_mode: PaymentStatsByMode[];
  by_type: PaymentStatsByType[];
  daily_trend: PaymentDailyTrendPoint[];
}

export interface PaymentStatsParams {
  bill_type?: PaymentBillType;
  date_from?: string;
  date_to?: string;
}

export const PAYMENT_BILL_TYPE_OPTIONS: Array<{ label: string; value: PaymentBillType }> = [
  { label: "OPD", value: "opd" },
  { label: "IPD", value: "ipd" },
  { label: "Daycare", value: "daycare" },
];

export const PAYMENT_MODE_OPTIONS: Array<{ label: string; value: PaymentMode }> = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "UPI", value: "upi" },
  { label: "Bank Transfer", value: "bank" },
  { label: "Online", value: "online" },
  { label: "Insurance", value: "insurance" },
  { label: "Cheque", value: "cheque" },
  { label: "Razorpay", value: "razorpay" },
  { label: "Multiple", value: "multiple" },
  { label: "Other", value: "other" },
];
