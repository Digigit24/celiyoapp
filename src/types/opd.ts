/** Types for dghms's OPD Visit domain (/api/opd/*). */
import type { BillItemSource, BillPaymentMode, BillPaymentStatus, CatalogType } from "./ipd";

export type VisitType = "new" | "follow_up" | "emergency" | "referral";
export type VisitPriority = "low" | "normal" | "high" | "urgent";
export type VisitStatus =
  | "waiting"
  | "called"
  | "in_consultation"
  | "completed"
  | "cancelled"
  | "no_show";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface VisitListItem {
  id: number;
  visit_number: string;
  patient: number;
  patient_name: string;
  patient_id: string;
  patient_photo: string | null;
  patient_mobile: string;
  patient_age: number | null;
  patient_gender: string;
  doctor: number | null;
  doctor_name: string | null;
  visit_date: string;
  visit_type: VisitType;
  priority: VisitPriority;
  status: VisitStatus;
  queue_position: number | null;
  payment_status: PaymentStatus;
  total_amount: string;
  paid_amount: string;
  balance_amount: string;
  waiting_time: number | null;
  entry_time: string;
  is_follow_up: boolean;
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes: string | null;
}

export interface VisitDetail extends VisitListItem {
  appointment: number | null;
  referred_by: number | null;
  referred_by_name: string | null;
  notify_referring_doctor: boolean;
  created_by_id: string | null;
  consultation_start_time: string | null;
  consultation_end_time: string | null;
  created_at: string;
  updated_at: string;
  patient_details: {
    patient_id: string;
    full_name: string;
    age: number | null;
    gender: string;
    blood_group: string | null;
    mobile: string;
  };
  doctor_details: {
    id: number;
    full_name: string;
    specialties: Array<{ id: string; name: string }>;
    consultation_fee: string;
    follow_up_fee: string;
  } | null;
  has_opd_bill: boolean;
  has_clinical_note: boolean;
  active_ipd_admission: { id: number; admission_id: string; status: string; ward_id: number } | null;
}

export interface VisitCreatePayload {
  patient: number;
  doctor?: number | null;
  appointment?: number | null;
  visit_date?: string;
  visit_type?: VisitType;
  is_follow_up?: boolean;
  referred_by?: number | null;
  notify_referring_doctor?: boolean;
  status?: VisitStatus;
  queue_position?: number;
}

export interface VisitQueue {
  waiting: VisitListItem[];
  called: VisitListItem[];
  in_consultation: VisitListItem[];
}

export interface SetFollowUpPayload {
  follow_up_required: boolean;
  follow_up_date: string | null;
  follow_up_notes?: string;
}

// ─── Statistics ─────────────────────────────────────────────────────────

export interface OPDStats {
  total_visits: number;
  by_status: {
    waiting: number;
    called: number;
    in_consultation: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
  total_revenue: string | null;
}

// ─── Vitals (VisitFinding — distinct from the New Visit form's discarded fields) ──

export interface VisitFinding {
  id: number;
  visit: number;
  finding_date: string;
  finding_type: "examination" | "systemic";
  temperature: string | null;
  pulse: number | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_pressure: string | null;
  weight: string | null;
  height: string | null;
  bmi: string | null;
  bmi_category: string | null;
  spo2: number | null;
  respiratory_rate: number | null;
  tongue: string | null;
  throat: string | null;
  cns: string | null;
  rs: string | null;
  cvs: string | null;
  pa: string | null;
  recorded_by_id: string | null;
}

export interface VisitFindingCreatePayload {
  temperature?: number;
  pulse?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  spo2?: number;
  weight?: number;
  height?: number;
  respiratory_rate?: number;
}

// ─── Attachments ────────────────────────────────────────────────────────

export type AttachmentFileType = "xray" | "report" | "prescription" | "scan" | "document" | "other";

export interface OpdAttachment {
  id: number;
  visit: number;
  file: string;
  file_name: string;
  file_type: AttachmentFileType;
  description: string | null;
  uploaded_by_id: string | null;
  uploaded_at: string;
}

// ─── Billing (multiple independent bills per visit, mirrors IPDBilling) ───

export type OpdType = "consultation" | "follow_up" | "emergency";
export type ChargeType = "first_visit" | "revisit" | "follow_up" | "emergency";

export interface OPDBillItem {
  id: number;
  bill: number;
  item_name: string;
  source: BillItemSource;
  quantity: string | number;
  system_calculated_price: string | null;
  unit_price: string;
  total_price: string;
  is_price_overridden: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OPDBill {
  id: number;
  bill_number: string;
  visit: number;
  visit_number: string;
  patient_name: string;
  doctor: number | null;
  doctor_name: string | null;
  bill_date: string;
  opd_type: OpdType;
  opd_subtype: string | null;
  charge_type: ChargeType;
  diagnosis: string | null;
  remarks: string | null;
  total_amount: string;
  discount_percent: string;
  discount_amount: string;
  payable_amount: string;
  payment_mode: BillPaymentMode | null;
  payment_details: Record<string, unknown> | null;
  received_amount: string;
  balance_amount: string;
  payment_status: BillPaymentStatus;
  items: OPDBillItem[];
  created_at: string;
  updated_at: string;
}

export interface OpdBillItemCreatePayload {
  bill: number;
  catalog_type?: CatalogType;
  catalog_id?: number;
  item_name?: string;
  source?: BillItemSource;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

/** Client-derived — the raw `payment_status` field isn't authoritative for display (see constants.ts). */
export type DerivedPaymentStatus = "no_bill" | "unpaid" | "partial" | "paid";
