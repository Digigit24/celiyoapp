import type { BadgeVariant } from "../../components/ui";
import type { BillItemSource } from "../../types/ipd";
import type { DerivedPaymentStatus, VisitListItem, VisitPriority, VisitStatus, VisitType } from "../../types/opd";

export const VISIT_STATUS_VARIANT: Record<VisitStatus, BadgeVariant> = {
  waiting: "warning",
  called: "default",
  in_consultation: "default",
  completed: "success",
  cancelled: "secondary",
  no_show: "destructive",
};

/** "normal" priority is intentionally never rendered as a badge — matches web (saves space, it's the common case). */
export const VISIT_PRIORITY_VARIANT: Partial<Record<VisitPriority, BadgeVariant>> = {
  low: "secondary",
  high: "warning",
  urgent: "destructive",
};

export const VISIT_TYPE_VARIANT: Record<VisitType, BadgeVariant> = {
  new: "default",
  follow_up: "secondary",
  emergency: "destructive",
  referral: "outline",
};

export const PAYMENT_STATUS_VARIANT: Record<DerivedPaymentStatus, BadgeVariant> = {
  no_bill: "secondary",
  unpaid: "destructive",
  partial: "warning",
  paid: "success",
};

/**
 * Client-derived — dghms's `payment_status` field on a Visit isn't
 * authoritative for display; celiyohms computes this from the live
 * total/paid/balance numbers instead. Ported verbatim from
 * `derivePaymentStatus()` in celiyohms's OpdVisitsTab.
 */
export function derivePaymentStatus(
  visit: Pick<VisitListItem, "total_amount" | "paid_amount" | "balance_amount">
): DerivedPaymentStatus {
  const total = Number(visit.total_amount);
  const paid = Number(visit.paid_amount);
  const balance = Number(visit.balance_amount);

  if (total <= 0.005 && paid <= 0) return "no_bill";
  if (balance <= 0.005) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

/** Subset of IPD's BillItemSource actually used by OPD bill items. */
export const OPD_BILL_ITEM_SOURCE_COLOR: Record<
  Extract<BillItemSource, "Consultation" | "Pharmacy" | "Lab" | "Radiology" | "Procedure" | "Package" | "Therapy" | "Other">,
  string
> = {
  Consultation: "#7c3aed",
  Pharmacy: "#059669",
  Lab: "#d97706",
  Radiology: "#0891b2",
  Procedure: "#e11d48",
  Package: "#4f46e5",
  Therapy: "#0d9488",
  Other: "#64748b",
};
