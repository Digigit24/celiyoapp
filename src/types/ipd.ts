/** Types for dghms's IPD Admission domain (/api/ipd/admissions/*). */

export type AdmissionStatus =
  | "admitted"
  | "discharged"
  | "transferred"
  | "absconded"
  | "referred"
  | "death";
export type AdmissionType = "regular" | "emergency" | "transfer" | "readmission" | "daycare";
export type ClaimStatus =
  | "not_applicable"
  | "not_started"
  | "documents_pending"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "settled";

export interface AdmissionListItem {
  id: number;
  admission_id: string;
  patient: number;
  patient_name: string;
  patient_id_display: string;
  patient_mobile: string;
  patient_age: number | null;
  patient_gender: string;
  patient_photo: string | null;
  doctor_id: string | null;
  ward_name: string;
  bed_number: string | null;
  admission_type: AdmissionType;
  admission_date: string;
  discharge_date: string | null;
  status: AdmissionStatus;
  has_mediclaim: boolean;
  tpa_name: string | null;
  claim_status: ClaimStatus;
  claim_reference_number: string | null;
  los_days: number;
  length_of_stay: string;
  bill_total: string | null;
  bill_paid: string | null;
  created_by_user_id: string | null;
}

export interface AdmissionDetail extends AdmissionListItem {
  tenant_id: string;
  // Matches hooks/masters.ts's Ward/Bed.id convention (string) — the same
  // apps/ipd domain, so these are the same identifiers, not re-derived.
  ward: string;
  bed: string | null;
  reason: string;
  provisional_diagnosis: string;
  final_diagnosis: string;
  claim_notes: string | null;
  discharge_summary: string | null;
  discharge_type: string | null;
  discharged_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdmissionCreatePayload {
  patient: number;
  ward: string;
  bed?: string | null;
  doctor_id?: string | null;
  admission_date?: string;
  reason: string;
  provisional_diagnosis?: string;
  has_mediclaim?: boolean;
  tpa_name?: string;
  claim_status?: ClaimStatus;
  claim_reference_number?: string;
  claim_notes?: string;
}

export interface DischargePayload {
  discharge_type?: string;
  discharge_summary?: string;
  final_diagnosis?: string;
  discharge_date?: string;
}

export const DISCHARGE_TYPE_OPTIONS = [
  { label: "Routine", value: "routine" },
  { label: "LAMA", value: "lama" },
  { label: "Transferred", value: "transferred" },
  { label: "Absconded", value: "absconded" },
  { label: "Death", value: "death" },
] as const;

export const TPA_OPTIONS = [
  "Star Health",
  "HDFC ERGO",
  "ICICI Lombard",
  "Bajaj Allianz",
  "New India Assurance",
  "National Insurance",
  "Care Health",
  "Other",
] as const;

// ─── Registration (merged patient + admission editor) ─────────────────────

/** Nested `patient` object inside GET/PATCH .../registration — a subset of
 * PatientDetail plus the guardian fields, matching apps/ipd/views.py's
 * `_registration_payload()` exactly. */
export interface RegistrationPatient {
  id: number;
  patient_id: string;
  title: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  gender: string;
  date_of_birth: string | null;
  age: number | null;
  mobile_primary: string;
  blood_group: string | null;
  marital_status: string | null;
  aadhaar_number: string | null;
  height: string | null;
  weight: string | null;
  bmi: string | null;
  address_line1: string | null;
  photo_data: string | null;
  guardian_first_name: string | null;
  guardian_middle_name: string | null;
  guardian_last_name: string | null;
  guardian_mobile: string | null;
  guardian_gender: string | null;
  guardian_relation: string | null;
  guardian_address: string | null;
  guardian_photo_data: string | null;
}

export interface RegistrationData {
  admission_pk: number;
  admission_id: string;
  admission_date: string;
  admission_type: AdmissionType;
  reason: string;
  provisional_diagnosis: string;
  doctor_id: string | null;
  reference_doctor_id: string | null;
  notify_reference_doctor: boolean;
  consulting_doctor_ids: string[];
  ward: string;
  bed: string | null;
  has_mediclaim: boolean;
  tpa_name: string | null;
  claim_status: ClaimStatus;
  claim_reference_number: string | null;
  claim_notes: string | null;
  patient: RegistrationPatient;
}

/** PATCH payload — a flat object, optionally with a nested `patient`. */
export interface RegistrationPatchPayload {
  admission_date?: string;
  admission_type?: AdmissionType;
  reason?: string;
  provisional_diagnosis?: string;
  reference_doctor_id?: string | null;
  doctor_id?: string;
  notify_reference_doctor?: boolean;
  consulting_doctor_ids?: string[];
  has_mediclaim?: boolean;
  tpa_name?: string;
  claim_status?: ClaimStatus;
  claim_reference_number?: string;
  claim_notes?: string;
  ward?: string;
  bed?: string | null;
  patient?: Partial<
    Pick<
      RegistrationPatient,
      | "title"
      | "first_name"
      | "middle_name"
      | "last_name"
      | "gender"
      | "date_of_birth"
      | "mobile_primary"
      | "blood_group"
      | "marital_status"
      | "aadhaar_number"
      | "height"
      | "weight"
      | "address_line1"
      | "photo_data"
      | "guardian_first_name"
      | "guardian_middle_name"
      | "guardian_last_name"
      | "guardian_mobile"
      | "guardian_gender"
      | "guardian_relation"
      | "guardian_address"
      | "guardian_photo_data"
    >
  >;
}

// ─── Bed transfer ────────────────────────────────────────────────────────

export interface BedTransfer {
  id: number;
  admission: number;
  admission_id: string;
  from_bed: string;
  from_bed_info: string;
  to_bed: string;
  to_bed_info: string;
  transfer_date: string;
  reason: string | null;
  performed_by_user_id: string | null;
  created_at: string;
}

// ─── Discharge packet (AI-assisted discharge summary) ──────────────────────

export type DischargePacketStatus = "draft" | "generated" | "approved";

export interface DischargeSectionValue {
  field_key: string;
  label: string;
  field_type: string;
  value: unknown;
}

export interface DischargeSection {
  record_id: number;
  form_code: string;
  form_name: string;
  occurrence_index: number;
  recorded_at: string;
  section_id: number;
  section_code: string;
  section_title: string;
  values: DischargeSectionValue[];
}

export interface DischargePacket {
  id: number;
  admission: number;
  status: DischargePacketStatus;
  narrative: string;
  sections: DischargeSection[];
  source_record_ids: number[];
  ai_model: string;
  generation_count: number;
  generated_at: string | null;
  approved_at: string | null;
  updated_at: string;
}

// ─── Billing ────────────────────────────────────────────────────────────

export type BillPaymentMode =
  | "cash"
  | "card"
  | "upi"
  | "bank"
  | "insurance"
  | "cheque"
  | "razorpay"
  | "multiple"
  | "other";
export type BillPaymentStatus = "unpaid" | "partial" | "paid";
export type BillItemSource =
  | "Bed"
  | "Pharmacy"
  | "Lab"
  | "Radiology"
  | "Consultation"
  | "Procedure"
  | "Surgery"
  | "Therapy"
  | "Package"
  | "Service"
  | "Other";
export type CatalogType = "procedure" | "package" | "service" | "investigation";

export interface BedDayInfo {
  total_los: number;
  already_billed_days: number;
  remaining_days: number;
  this_bill_days: number;
}

export interface IPDBillItem {
  id: number;
  bill: number;
  item_name: string;
  source: BillItemSource;
  quantity: string | number;
  system_calculated_price: string | null;
  unit_price: string;
  actual_price: string;
  total_price: string;
  is_price_overridden: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IPDBilling {
  id: number;
  tenant_id: string;
  admission: number;
  admission_id: string;
  patient_name: string;
  bill_number: string;
  bill_date: string;
  doctor_id: string | null;
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
  items: IPDBillItem[];
  bed_day_info: BedDayInfo;
  billed_by_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillItemCreatePayload {
  bill: number;
  catalog_type?: CatalogType;
  catalog_id?: number;
  item_name?: string;
  source?: BillItemSource;
  quantity: number;
  unit_price?: number;
  notes?: string;
}

export interface IPDBillTemplateItem {
  id: number;
  template: number;
  item_name: string;
  source: BillItemSource;
  default_quantity: string | number;
  default_unit_price: string;
  is_active: boolean;
}

export interface IPDBillTemplate {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  bill_type: "opd" | "ipd";
  ipd_bill: number | null;
  opd_bill: number | null;
  bill_number: string;
  patient_name: string;
  encounter_number: string;
  amount: string;
  payment_mode: BillPaymentMode;
  payment_date: string;
  notes: string | null;
  recorded_by_user_id: string | null;
  created_at: string;
}

export const IPD_PAYMENT_MODES: Array<{ label: string; value: BillPaymentMode }> = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "UPI", value: "upi" },
  { label: "Bank Transfer", value: "bank" },
  { label: "Insurance", value: "insurance" },
  { label: "Cheque", value: "cheque" },
  { label: "Other", value: "other" },
];

export const IPD_SOURCE_OPTIONS: BillItemSource[] = [
  "Bed",
  "Consultation",
  "Pharmacy",
  "Lab",
  "Radiology",
  "Procedure",
  "Surgery",
  "Therapy",
  "Package",
  "Other",
];

// ─── Statistics ─────────────────────────────────────────────────────────

export interface IPDStats {
  total_admissions: number;
  currently_admitted: number;
  discharged_today: number;
  discharged: number;
  transferred: number;
  absconded: number;
  referred: number;
  death: number;
  mediclaim: number;
  claim_not_started: number;
  claim_documents_pending: number;
  claim_submitted: number;
  claim_under_review: number;
  claim_approved: number;
  claim_rejected: number;
  claim_settled: number;
  avg_length_of_stay_days: number | null;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
  by_tpa: Array<{ tpa_name: string | null; count: number }>;
}

// ─── Consents & Stationery documents ────────────────────────────────────

export type DocumentType = "consent" | "stationery" | "certificate";

export interface ClinicalDocumentTemplate {
  code: string;
  name: string;
  doc_type: DocumentType;
  languages: string[];
  requires_signature: boolean;
  applicable_entity_types: string[];
  display_order: number;
}
