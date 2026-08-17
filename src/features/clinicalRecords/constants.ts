/**
 * Clinical Records module — demo data and shared constants.
 *
 * This is a cross-encounter records INDEX/repository — a searchable browser
 * over a patient's historical clinical documents (discharge summaries,
 * consultation notes, investigation reports) across OPD, IPD, and Daycare
 * encounters. It is NOT the live EMR form editor — that engine lives at
 * `src/features/clinical/` (types, `ClinicalFormRenderer`, `EmrWorkspace`,
 * autosave, etc.) and is untouched by this module. This screen only reads a
 * flattened, read-only summary of already-recorded field values.
 *
 * No backend exists yet for this records index. The constants below are
 * realistic-looking fixtures used by the hooks until a real
 * `./lib/api/clinicalRecords` lands. When the API arrives, the hook swap is
 * the only change required — the screen contract stays stable.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { ChipVariant } from "../../components/ui";

export type ClinicalRecordEncounterType = "opd" | "ipd" | "daycare";

export type ClinicalRecordLockStatus = "draft" | "locked";

export interface ClinicalRecordFieldValue {
  label: string;
  value: string;
}

export interface ClinicalRecordAuditEvent {
  title: string;
  subtitle?: string;
  when: string;
  tint: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  icon?:
    | "create"
    | "pencil"
    | "lock-closed"
    | "checkmark-circle"
    | "time"
    | "document-text";
}

export interface ClinicalRecordEntry {
  id: string;
  recordRef: string;
  patientName: string;
  patientId: string;
  encounterType: ClinicalRecordEncounterType;
  encounterRef: string;
  /** Form / record name, e.g. "Discharge Summary". */
  recordName: string;
  /** Date the record was created/finalised (ISO yyyy-mm-dd). */
  date: string;
  doctor: string;
  lockStatus: ClinicalRecordLockStatus;
  /** Flat read-only rendering of a few representative field values. */
  fieldValues: ClinicalRecordFieldValue[];
  auditTimeline: ClinicalRecordAuditEvent[];
}

export const ENCOUNTER_TYPE_LABELS: Record<ClinicalRecordEncounterType, string> = {
  opd: "OPD",
  ipd: "IPD",
  daycare: "Daycare",
};

export const ENCOUNTER_TYPE_CHIP_VARIANT: Record<ClinicalRecordEncounterType, ChipVariant> = {
  opd: "info",
  ipd: "warning",
  daycare: "success",
};

export const LOCK_STATUS_LABELS: Record<ClinicalRecordLockStatus, string> = {
  draft: "Draft",
  locked: "Locked",
};

export const LOCK_STATUS_CHIP_VARIANT: Record<ClinicalRecordLockStatus, ChipVariant> = {
  draft: "warning",
  locked: "success",
};

export const CLINICAL_RECORDS_FILTER_OPTIONS: Array<{
  id: "all" | ClinicalRecordEncounterType;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "opd", label: "OPD" },
  { id: "ipd", label: "IPD" },
  { id: "daycare", label: "Daycare" },
];

/** Compact display label for a date — "17 Aug 2026". */
export function formatRecordDate(date: string): string {
  const [y, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = months[m - 1] ?? "—";
  return `${d} ${label} ${y}`;
}

// __demo: true — placeholder fixtures used until the clinical records API is wired.
export const DEMO_CLINICAL_RECORDS: ClinicalRecordEntry[] = [
  {
    id: "cr-2026-0001",
    recordRef: "CR-40231",
    patientName: "Aarav Sharma",
    patientId: "P-10234",
    encounterType: "opd",
    encounterRef: "OPD-9821",
    recordName: "OPD Consultation Note",
    date: "2026-08-17",
    doctor: "Dr. Rajesh Mehta",
    lockStatus: "locked",
    fieldValues: [
      { label: "Chief complaint", value: "Fever and sore throat, 3 days" },
      { label: "Diagnosis", value: "Acute pharyngitis" },
      { label: "Advice", value: "Rest, warm saline gargles, review in 5 days" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Rajesh Mehta", when: "10:12", tint: "slate", icon: "create" },
      { title: "Last edited", subtitle: "Dr. Rajesh Mehta", when: "10:38", tint: "blue", icon: "pencil" },
      { title: "Locked", subtitle: "Auto-locked on visit close", when: "10:40", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0002",
    recordRef: "CR-40232",
    patientName: "Meera Pillai",
    patientId: "P-07721",
    encounterType: "ipd",
    encounterRef: "IPD-7199",
    recordName: "Discharge Summary",
    date: "2026-08-16",
    doctor: "Dr. Sameer Khanna",
    lockStatus: "locked",
    fieldValues: [
      { label: "Admission diagnosis", value: "Acute appendicitis" },
      { label: "Procedure performed", value: "Laparoscopic appendectomy" },
      { label: "Condition at discharge", value: "Stable, afebrile, wound healing well" },
      { label: "Follow-up", value: "OPD review in 7 days, suture removal" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Sameer Khanna", when: "14 Aug, 09:20", tint: "slate", icon: "create" },
      { title: "Last edited", subtitle: "Dr. Sameer Khanna", when: "16 Aug, 11:05", tint: "blue", icon: "pencil" },
      { title: "Locked", subtitle: "Approved on discharge", when: "16 Aug, 11:30", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0003",
    recordRef: "CR-40233",
    patientName: "Rohan Verma",
    patientId: "P-11002",
    encounterType: "opd",
    encounterRef: "LAB-5523",
    recordName: "Investigation Report",
    date: "2026-08-16",
    doctor: "Dr. Anjali Rao",
    lockStatus: "locked",
    fieldValues: [
      { label: "Test", value: "Lipid Profile" },
      { label: "Total cholesterol", value: "212 mg/dL" },
      { label: "LDL", value: "148 mg/dL" },
      { label: "Impression", value: "Borderline high LDL, dietary advice given" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Lab · Auto-generated", when: "18:05", tint: "slate", icon: "create" },
      { title: "Reviewed", subtitle: "Dr. Anjali Rao", when: "18:20", tint: "blue", icon: "checkmark-circle" },
      { title: "Locked", subtitle: "Report finalised", when: "18:22", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0004",
    recordRef: "CR-40234",
    patientName: "Saanvi Joshi",
    patientId: "P-12008",
    encounterType: "daycare",
    encounterRef: "DC-2310",
    recordName: "Daycare Session Note",
    date: "2026-08-17",
    doctor: "Dr. Kavita Mehta",
    lockStatus: "draft",
    fieldValues: [
      { label: "Session type", value: "Chemotherapy · Cycle 4 of 6" },
      { label: "Regimen", value: "FOLFOX" },
      { label: "Tolerance", value: "Good, no acute reaction so far" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Kavita Mehta", when: "09:05", tint: "slate", icon: "create" },
      { title: "Last edited", subtitle: "Dr. Kavita Mehta", when: "11:20", tint: "blue", icon: "pencil" },
    ],
  },
  {
    id: "cr-2026-0005",
    recordRef: "CR-40235",
    patientName: "Diya Iyer",
    patientId: "P-09812",
    encounterType: "ipd",
    encounterRef: "IPD-7341",
    recordName: "Pre-operative Assessment",
    date: "2026-08-15",
    doctor: "Dr. Sameer Khanna",
    lockStatus: "locked",
    fieldValues: [
      { label: "ASA grade", value: "II" },
      { label: "Fitness for surgery", value: "Fit, no contraindications" },
      { label: "Anaesthesia plan", value: "General anaesthesia" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Sameer Khanna", when: "14 Aug, 15:10", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Approved before surgery", when: "14 Aug, 16:00", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0006",
    recordRef: "CR-40236",
    patientName: "Kabir Reddy",
    patientId: "P-09311",
    encounterType: "opd",
    encounterRef: "OPD-9788",
    recordName: "Prescription",
    date: "2026-08-15",
    doctor: "Dr. Rajesh Mehta",
    lockStatus: "locked",
    fieldValues: [
      { label: "Diagnosis", value: "Upper respiratory tract infection" },
      { label: "Medications", value: "Amoxicillin 500mg BD x 5 days, Cetirizine 10mg OD" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Rajesh Mehta", when: "13:10", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Auto-locked on visit close", when: "13:15", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0007",
    recordRef: "CR-40237",
    patientName: "Ishaan Kapoor",
    patientId: "P-06712",
    encounterType: "ipd",
    encounterRef: "IPD-7301",
    recordName: "ICU Progress Note",
    date: "2026-08-14",
    doctor: "Dr. Neha Bhatt",
    lockStatus: "draft",
    fieldValues: [
      { label: "Day of admission", value: "Day 2" },
      { label: "Vitals trend", value: "BP stabilising, weaning off vasopressor" },
      { label: "Plan", value: "Continue ventilator support, repeat ABG in 6h" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Neha Bhatt", when: "08:00", tint: "slate", icon: "create" },
      { title: "Last edited", subtitle: "Dr. Neha Bhatt", when: "14:30", tint: "blue", icon: "pencil" },
    ],
  },
  {
    id: "cr-2026-0008",
    recordRef: "CR-40238",
    patientName: "Tara Bose",
    patientId: "P-11823",
    encounterType: "ipd",
    encounterRef: "IPD-7352",
    recordName: "Nursing Care Plan",
    date: "2026-08-15",
    doctor: "Nurse · Latha Pillai",
    lockStatus: "draft",
    fieldValues: [
      { label: "Care priorities", value: "Pain management, mobility assistance" },
      { label: "Diet", value: "Soft diet, low sodium" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Nurse · Latha Pillai", when: "07:45", tint: "slate", icon: "create" },
    ],
  },
  {
    id: "cr-2026-0009",
    recordRef: "CR-40239",
    patientName: "Arjun Nair",
    patientId: "P-10029",
    encounterType: "opd",
    encounterRef: "LAB-5499",
    recordName: "Investigation Report",
    date: "2026-08-14",
    doctor: "Dr. Anjali Rao",
    lockStatus: "locked",
    fieldValues: [
      { label: "Test", value: "Full body checkup panel" },
      { label: "Impression", value: "All parameters within normal limits" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Lab · Auto-generated", when: "17:50", tint: "slate", icon: "create" },
      { title: "Reviewed", subtitle: "Dr. Anjali Rao", when: "18:10", tint: "blue", icon: "checkmark-circle" },
      { title: "Locked", subtitle: "Report finalised", when: "18:12", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0010",
    recordRef: "CR-40240",
    patientName: "Anaya Desai",
    patientId: "P-08401",
    encounterType: "opd",
    encounterRef: "OPD-9691",
    recordName: "Procedure Note",
    date: "2026-08-14",
    doctor: "Dr. Sameer Khanna",
    lockStatus: "locked",
    fieldValues: [
      { label: "Procedure", value: "Wart cauterisation, left hand" },
      { label: "Anaesthesia", value: "Local, topical" },
      { label: "Outcome", value: "Uncomplicated, dressing applied" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Sameer Khanna", when: "16:00", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Auto-locked on visit close", when: "16:20", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0011",
    recordRef: "CR-40241",
    patientName: "Myra Bhandari",
    patientId: "P-12934",
    encounterType: "ipd",
    encounterRef: "IPD-7288",
    recordName: "Discharge Summary",
    date: "2026-08-13",
    doctor: "Dr. Priya Sen",
    lockStatus: "locked",
    fieldValues: [
      { label: "Admission diagnosis", value: "Full-term pregnancy, labour" },
      { label: "Delivery type", value: "Normal vaginal delivery" },
      { label: "Baby status", value: "Healthy, 3.1kg, APGAR 9/10" },
      { label: "Follow-up", value: "Postnatal check in 1 week" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Priya Sen", when: "12 Aug, 09:00", tint: "slate", icon: "create" },
      { title: "Last edited", subtitle: "Dr. Priya Sen", when: "12 Aug, 18:40", tint: "blue", icon: "pencil" },
      { title: "Locked", subtitle: "Approved on discharge", when: "13 Aug, 09:15", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0012",
    recordRef: "CR-40242",
    patientName: "Veer Choudhury",
    patientId: "P-13101",
    encounterType: "opd",
    encounterRef: "OPD-9812",
    recordName: "Tele-consultation Note",
    date: "2026-08-14",
    doctor: "Dr. Rajesh Mehta",
    lockStatus: "locked",
    fieldValues: [
      { label: "Mode", value: "Video consultation" },
      { label: "Chief complaint", value: "Follow-up for hypertension" },
      { label: "Advice", value: "Continue Amlodipine 5mg OD, recheck BP weekly" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Rajesh Mehta", when: "08:56", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Auto-locked on visit close", when: "09:05", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0013",
    recordRef: "CR-40243",
    patientName: "Priya Menon",
    patientId: "P-11290",
    encounterType: "opd",
    encounterRef: "PH-4398",
    recordName: "Pharmacy Counselling Note",
    date: "2026-08-13",
    doctor: "Pharmacist · Vivek Iyer",
    lockStatus: "locked",
    fieldValues: [
      { label: "Counselled on", value: "Insulin pen technique, storage" },
      { label: "Adherence check", value: "Good, no missed doses reported" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Pharmacist · Vivek Iyer", when: "15:22", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Session closed", when: "15:30", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0014",
    recordRef: "CR-40244",
    patientName: "Ramesh Nair",
    patientId: "P-08823",
    encounterType: "daycare",
    encounterRef: "DC-2311",
    recordName: "Daycare Session Note",
    date: "2026-08-17",
    doctor: "Dr. Arvind Rao",
    lockStatus: "locked",
    fieldValues: [
      { label: "Session type", value: "Haemodialysis · Routine" },
      { label: "Fluid removed", value: "2.4 L" },
      { label: "Complications", value: "None" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Arvind Rao", when: "07:05", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Session completed", when: "10:00", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0015",
    recordRef: "CR-40245",
    patientName: "Yash Kulkarni",
    patientId: "P-05518",
    encounterType: "opd",
    encounterRef: "OPD-9788",
    recordName: "OPD Consultation Note",
    date: "2026-08-15",
    doctor: "Dr. Rajesh Mehta",
    lockStatus: "locked",
    fieldValues: [
      { label: "Chief complaint", value: "Follow-up, mild cough" },
      { label: "Diagnosis", value: "Resolving viral URI" },
      { label: "Advice", value: "No further medication needed" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Rajesh Mehta", when: "13:16", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Auto-locked on visit close", when: "13:22", tint: "emerald", icon: "lock-closed" },
    ],
  },
  {
    id: "cr-2026-0016",
    recordRef: "CR-40246",
    patientName: "Neha Kulkarni",
    patientId: "P-09902",
    encounterType: "daycare",
    encounterRef: "DC-2313",
    recordName: "Daycare Session Note",
    date: "2026-08-16",
    doctor: "Dr. Priya Sen",
    lockStatus: "locked",
    fieldValues: [
      { label: "Session type", value: "Post-endoscopy observation" },
      { label: "Vitals", value: "Stable throughout, no distress" },
    ],
    auditTimeline: [
      { title: "Created", subtitle: "Dr. Priya Sen", when: "10:10", tint: "slate", icon: "create" },
      { title: "Locked", subtitle: "Discharged", when: "16:05", tint: "emerald", icon: "lock-closed" },
    ],
  },
];

/**
 * Quick aggregate numbers shown in the QuickStats row of the detail screen.
 * Real values would come from the API; for demo we compute deterministic
 * totals so the row looks plausible.
 */
export const DEMO_CLINICAL_RECORDS_QUICK_STATS = {
  totalRecords: 214,
  lockedThisWeek: 42,
  draftRecords: 3,
  editedToday: 6,
};
