/**
 * Payments module — shared constants.
 *
 * Backed by the real dghms unified bill-payment ledger
 * (`/api/payments/bill-payments`, apps.payments) — see `src/lib/api/payments.ts`
 * and `src/types/payments.ts` for the wire contract.
 *
 * There is NO `status` field, timeline, or breakdown-lines concept on this
 * model — a payment row simply exists once created. Don't reintroduce those;
 * the detail screen shows only fields the API actually returns.
 */

import type { ChipVariant } from "../../components/ui";
import type { PaymentBillType, PaymentMode } from "../../types/payments";

export const PAYMENT_METHOD_LABELS: Record<PaymentMode, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank: "Bank Transfer",
  online: "Online",
  insurance: "Insurance",
  cheque: "Cheque",
  razorpay: "Razorpay",
  multiple: "Multiple",
  other: "Other",
};

export const BILL_TYPE_LABELS: Record<PaymentBillType, string> = {
  opd: "OPD",
  ipd: "IPD",
  daycare: "Daycare",
};

export const BILL_TYPE_CHIP_VARIANT: Record<PaymentBillType, ChipVariant> = {
  opd: "info",
  ipd: "warning",
  daycare: "success",
};

export const PAYMENTS_BILL_TYPE_FILTER_OPTIONS: Array<{
  id: "all" | PaymentBillType;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "opd", label: "OPD" },
  { id: "ipd", label: "IPD" },
  { id: "daycare", label: "Daycare" },
];

/**
 * Format an INR (₹) amount. The API returns amounts as string decimals; this
 * also accepts a plain number for convenience. Decimals are dropped when the
 * amount is a whole rupee, otherwise shown with 2 decimal places.
 */
export function formatINR(amount: string | number): string {
  const value = typeof amount === "string" ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return "₹0";
  if (Number.isInteger(value)) return `₹${value.toLocaleString("en-IN")}`;
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Compact display label for an ISO yyyy-mm-dd date — "17 Aug 2026". */
export function formatPaymentDate(date: string): string {
  const [y, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = months[m - 1] ?? "—";
  return `${d} ${label} ${y}`;
}

/** Today's date as YYYY-MM-DD, for defaulting the payment_date field. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
