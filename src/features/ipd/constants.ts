import type { AdmissionStatus, BillItemSource, BillPaymentMode, ClaimStatus } from "../../types/ipd";
import type { BadgeVariant } from "../../components/ui";

export const ADMISSION_STATUS_VARIANT: Record<AdmissionStatus, BadgeVariant> = {
  admitted: "default",
  discharged: "success",
  transferred: "warning",
  absconded: "destructive",
  referred: "outline",
  death: "secondary",
};

/** Left-accent-bar + dot color per admission status, for list-row scannability. */
export const ADMISSION_STATUS_ACCENT: Record<AdmissionStatus, { bar: string; dot: string }> = {
  admitted: { bar: "#3b82f6", dot: "#3b82f6" },
  discharged: { bar: "#10b981", dot: "#10b981" },
  transferred: { bar: "#f59e0b", dot: "#f59e0b" },
  absconded: { bar: "#ef4444", dot: "#ef4444" },
  referred: { bar: "#a855f7", dot: "#a855f7" },
  death: { bar: "#64748b", dot: "#64748b" },
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  not_applicable: "Not applicable",
  not_started: "Not started",
  documents_pending: "Documents pending",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
  settled: "Settled",
};

/** Linear claim journey (rejected is a separate terminal state, not a step). */
export const CLAIM_STATUS_STEPS: ClaimStatus[] = [
  "not_started",
  "documents_pending",
  "submitted",
  "under_review",
  "approved",
  "settled",
];

export const BILL_ITEM_SOURCE_COLOR: Record<BillItemSource, string> = {
  Bed: "#2563eb",
  Consultation: "#7c3aed",
  Pharmacy: "#059669",
  Lab: "#d97706",
  Radiology: "#0891b2",
  Procedure: "#e11d48",
  Surgery: "#dc2626",
  Therapy: "#0d9488",
  Package: "#4f46e5",
  Service: "#c026d3",
  Other: "#64748b",
};

export const PAYMENT_MODE_LABEL: Record<BillPaymentMode, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank: "Bank Transfer",
  insurance: "Insurance",
  cheque: "Cheque",
  razorpay: "Razorpay",
  multiple: "Multiple",
  other: "Other",
};

export function formatStayDuration(admissionDate: string, dischargeDate?: string | null): string {
  const start = new Date(admissionDate).getTime();
  const end = dischargeDate ? new Date(dischargeDate).getTime() : Date.now();
  const minutes = Math.max(0, Math.floor((end - start) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d`;
}
