/**
 * Lab / Diagnostics module — demo data and shared constants.
 *
 * Module id is `diagnostics` (see `src/constants/modules.ts`); the drawer
 * label is "Lab" — screen/component names follow the drawer label.
 *
 * No backend exists yet for this module (Phase 3). The constants below are
 * realistic-looking fixtures used by the hooks until the real
 * `./lib/api/diagnostics` lands. When the API arrives, the hook swap is the
 * only change required — the screen contract stays stable.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { Ionicons } from "@expo/vector-icons";
import type { ChipVariant } from "../../components/ui";

export type LabOrderStatus =
  | "ordered"
  | "sample-collected"
  | "in-progress"
  | "completed"
  | "reported";

export type ResultFlag = "normal" | "low" | "high" | "critical";

export interface LabTestLine {
  testName: string;
  normalRange: string;
  resultValue?: string;
  flag?: ResultFlag;
}

export interface LabSampleInfo {
  sampleType: string;
  collectedBy: string;
  collectedAt: string;
}

export interface LabTimelineEvent {
  title: string;
  subtitle?: string;
  when: string;
  tint: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface LabOrder {
  id: string;
  orderRef: string;
  date: string;
  time: string;
  patientName: string;
  patientId: string;
  panels: string[];
  orderingDoctor: string;
  status: LabOrderStatus;
  tests: LabTestLine[];
  sample: LabSampleInfo;
  timeline: LabTimelineEvent[];
}

export const LAB_STATUS_LABELS: Record<LabOrderStatus, string> = {
  ordered: "Ordered",
  "sample-collected": "Sample collected",
  "in-progress": "In progress",
  completed: "Completed",
  reported: "Reported",
};

export const LAB_STATUS_CHIP_VARIANT: Record<LabOrderStatus, ChipVariant> = {
  ordered: "neutral",
  "sample-collected": "info",
  "in-progress": "warning",
  completed: "success",
  reported: "success",
};

export const LAB_FILTER_OPTIONS: Array<{ id: "all" | LabOrderStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "ordered", label: "Ordered" },
  { id: "sample-collected", label: "Collected" },
  { id: "in-progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "reported", label: "Reported" },
];

export const RESULT_FLAG_LABELS: Record<ResultFlag, string> = {
  normal: "Normal",
  low: "Low",
  high: "High",
  critical: "Critical",
};

export const RESULT_FLAG_CHIP_VARIANT: Record<ResultFlag, ChipVariant> = {
  normal: "success",
  low: "warning",
  high: "warning",
  critical: "danger",
};

/** Compact display label — "17 Aug · 10:42". */
export function formatOrderDateTime(date: string, time: string): string {
  const [, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = months[m - 1] ?? "—";
  return `${d} ${label} · ${time}`;
}

// __demo: true — placeholder fixtures used until the diagnostics API is wired.
export const DEMO_LAB_ORDERS: LabOrder[] = [
  {
    id: "lab-2026-0001",
    orderRef: "LAB-5523",
    date: "2026-08-17",
    time: "09:20",
    patientName: "Rohan Verma",
    patientId: "P-11002",
    panels: ["Lipid Profile", "Thyroid Profile"],
    orderingDoctor: "Dr. Nikhil Mehta",
    status: "reported",
    tests: [
      { testName: "Total Cholesterol", normalRange: "125-200 mg/dL", resultValue: "238 mg/dL", flag: "high" },
      { testName: "HDL Cholesterol", normalRange: "40-60 mg/dL", resultValue: "38 mg/dL", flag: "low" },
      { testName: "LDL Cholesterol", normalRange: "<130 mg/dL", resultValue: "150 mg/dL", flag: "high" },
      { testName: "TSH", normalRange: "0.4-4.0 mIU/L", resultValue: "2.1 mIU/L", flag: "normal" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Anil K.", collectedAt: "17 Aug, 09:35" },
    timeline: [
      { title: "Report released", subtitle: "Verified by Dr. Kunal Shah", when: "12:10", tint: "emerald", icon: "checkmark-circle" },
      { title: "Processing complete", when: "11:40", tint: "blue", icon: "flask" },
      { title: "Sample collected", subtitle: "Venous blood", when: "09:35", tint: "blue", icon: "water" },
      { title: "Order received", when: "09:20", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0002",
    orderRef: "LAB-5499",
    date: "2026-08-17",
    time: "08:12",
    patientName: "Arjun Nair",
    patientId: "P-10029",
    panels: ["Full Body Checkup"],
    orderingDoctor: "Dr. Sana Fatima",
    status: "in-progress",
    tests: [
      { testName: "Hemoglobin", normalRange: "13-17 g/dL", resultValue: "14.2 g/dL", flag: "normal" },
      { testName: "Fasting Glucose", normalRange: "70-100 mg/dL" },
      { testName: "Creatinine", normalRange: "0.6-1.3 mg/dL" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Sunita R.", collectedAt: "17 Aug, 08:25" },
    timeline: [
      { title: "Processing", subtitle: "2 of 3 results in", when: "10:15", tint: "amber", icon: "hourglass" },
      { title: "Sample collected", when: "08:25", tint: "blue", icon: "water" },
      { title: "Order received", when: "08:12", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0003",
    orderRef: "LAB-5477",
    date: "2026-08-16",
    time: "11:10",
    patientName: "Atharv Tiwari",
    patientId: "P-07002",
    panels: ["Dengue NS1 Antigen"],
    orderingDoctor: "Dr. Ananya Kapoor",
    status: "reported",
    tests: [
      { testName: "Dengue NS1 Antigen", normalRange: "Non-reactive", resultValue: "Reactive", flag: "critical" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Anil K.", collectedAt: "16 Aug, 11:22" },
    timeline: [
      { title: "Report released — critical value called", subtitle: "Dr. Ananya Kapoor notified", when: "13:05", tint: "rose", icon: "alert-circle" },
      { title: "Processing complete", when: "12:40", tint: "blue", icon: "flask" },
      { title: "Sample collected", when: "11:22", tint: "blue", icon: "water" },
      { title: "Order received", when: "11:10", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0004",
    orderRef: "LAB-5352",
    date: "2026-08-16",
    time: "09:40",
    patientName: "Diya Iyer",
    patientId: "P-09812",
    panels: ["HbA1c", "Renal Function Test"],
    orderingDoctor: "Dr. Rajeev Kapoor",
    status: "sample-collected",
    tests: [
      { testName: "HbA1c", normalRange: "4-5.6%" },
      { testName: "Urea", normalRange: "15-40 mg/dL" },
      { testName: "Creatinine", normalRange: "0.6-1.3 mg/dL" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Sunita R.", collectedAt: "16 Aug, 09:55" },
    timeline: [
      { title: "Sample collected", subtitle: "Awaiting lab pickup", when: "09:55", tint: "blue", icon: "water" },
      { title: "Order received", subtitle: "Linked to IPD-7341", when: "09:40", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0005",
    orderRef: "LAB-5301",
    date: "2026-08-15",
    time: "17:02",
    patientName: "Saanvi Joshi",
    patientId: "P-12008",
    panels: ["Complete Blood Count"],
    orderingDoctor: "Dr. Ananya Kapoor",
    status: "reported",
    tests: [
      { testName: "Hemoglobin", normalRange: "12-15 g/dL", resultValue: "9.8 g/dL", flag: "low" },
      { testName: "WBC Count", normalRange: "4000-11000/µL", resultValue: "3200/µL", flag: "low" },
      { testName: "Platelet Count", normalRange: "150000-410000/µL", resultValue: "180000/µL", flag: "normal" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Anil K.", collectedAt: "15 Aug, 17:15" },
    timeline: [
      { title: "Report released", subtitle: "Chemo-related cytopenia noted", when: "19:30", tint: "emerald", icon: "checkmark-circle" },
      { title: "Processing complete", when: "19:00", tint: "blue", icon: "flask" },
      { title: "Sample collected", when: "17:15", tint: "blue", icon: "water" },
      { title: "Order received", subtitle: "Linked to DC-2310", when: "17:02", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0006",
    orderRef: "LAB-5288",
    date: "2026-08-15",
    time: "10:20",
    patientName: "Yash Kulkarni",
    patientId: "P-05518",
    panels: ["Urine Routine"],
    orderingDoctor: "Dr. Nikhil Mehta",
    status: "reported",
    tests: [
      { testName: "Protein", normalRange: "Nil", resultValue: "Nil", flag: "normal" },
      { testName: "Pus Cells", normalRange: "0-5/hpf", resultValue: "2/hpf", flag: "normal" },
    ],
    sample: { sampleType: "Urine (midstream)", collectedBy: "Self-collected", collectedAt: "15 Aug, 10:30" },
    timeline: [
      { title: "Report released", when: "12:00", tint: "emerald", icon: "checkmark-circle" },
      { title: "Sample collected", when: "10:30", tint: "blue", icon: "water" },
      { title: "Order received", when: "10:20", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0007",
    orderRef: "LAB-5220",
    date: "2026-08-14",
    time: "16:40",
    patientName: "Ishaan Kapoor",
    patientId: "P-06712",
    panels: ["Arterial Blood Gas", "Serum Lactate"],
    orderingDoctor: "Dr. Rajeev Kapoor",
    status: "in-progress",
    tests: [
      { testName: "pH", normalRange: "7.35-7.45" },
      { testName: "Lactate", normalRange: "0.5-1 mmol/L" },
    ],
    sample: { sampleType: "Arterial blood", collectedBy: "ICU Nurse · Rekha S.", collectedAt: "14 Aug, 16:45" },
    timeline: [
      { title: "STAT processing", subtitle: "ICU priority", when: "16:50", tint: "amber", icon: "hourglass" },
      { title: "Sample collected", when: "16:45", tint: "blue", icon: "water" },
      { title: "Order received", subtitle: "Linked to IPD-7301", when: "16:40", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0008",
    orderRef: "LAB-5198",
    date: "2026-08-14",
    time: "13:15",
    patientName: "Priya Menon",
    patientId: "P-11290",
    panels: ["HbA1c"],
    orderingDoctor: "Dr. Sana Fatima",
    status: "reported",
    tests: [
      { testName: "HbA1c", normalRange: "4-5.6%", resultValue: "7.8%", flag: "high" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Anil K.", collectedAt: "14 Aug, 13:25" },
    timeline: [
      { title: "Report released", when: "15:40", tint: "emerald", icon: "checkmark-circle" },
      { title: "Processing complete", when: "15:10", tint: "blue", icon: "flask" },
      { title: "Sample collected", when: "13:25", tint: "blue", icon: "water" },
      { title: "Order received", when: "13:15", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0009",
    orderRef: "LAB-5140",
    date: "2026-08-13",
    time: "18:30",
    patientName: "Veer Choudhury",
    patientId: "P-13101",
    panels: ["COVID-19 RT-PCR"],
    orderingDoctor: "Dr. Ananya Kapoor",
    status: "ordered",
    tests: [
      { testName: "SARS-CoV-2 RNA", normalRange: "Not detected" },
    ],
    sample: { sampleType: "Nasopharyngeal swab", collectedBy: "Pending", collectedAt: "—" },
    timeline: [
      { title: "Order received", subtitle: "Awaiting sample collection", when: "18:30", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0010",
    orderRef: "LAB-5099",
    date: "2026-08-13",
    time: "12:05",
    patientName: "Meera Pillai",
    patientId: "P-07721",
    panels: ["Coagulation Profile"],
    orderingDoctor: "Dr. Rajeev Kapoor",
    status: "reported",
    tests: [
      { testName: "PT", normalRange: "11-13.5 sec", resultValue: "12.4 sec", flag: "normal" },
      { testName: "INR", normalRange: "0.8-1.1", resultValue: "1.0", flag: "normal" },
      { testName: "aPTT", normalRange: "25-35 sec", resultValue: "42 sec", flag: "high" },
    ],
    sample: { sampleType: "Venous blood (citrate)", collectedBy: "Phlebotomist · Sunita R.", collectedAt: "13 Aug, 12:18" },
    timeline: [
      { title: "Report released", subtitle: "Pre-surgical clearance", when: "14:30", tint: "emerald", icon: "checkmark-circle" },
      { title: "Processing complete", when: "14:00", tint: "blue", icon: "flask" },
      { title: "Sample collected", when: "12:18", tint: "blue", icon: "water" },
      { title: "Order received", subtitle: "Linked to IPD-7199", when: "12:05", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0011",
    orderRef: "LAB-5041",
    date: "2026-08-12",
    time: "09:00",
    patientName: "Kabir Reddy",
    patientId: "P-09311",
    panels: ["Liver Function Test"],
    orderingDoctor: "Dr. Nikhil Mehta",
    status: "sample-collected",
    tests: [
      { testName: "SGPT (ALT)", normalRange: "7-56 U/L" },
      { testName: "SGOT (AST)", normalRange: "5-40 U/L" },
      { testName: "Bilirubin (Total)", normalRange: "0.1-1.2 mg/dL" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Anil K.", collectedAt: "12 Aug, 09:12" },
    timeline: [
      { title: "Sample collected", when: "09:12", tint: "blue", icon: "water" },
      { title: "Order received", when: "09:00", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0012",
    orderRef: "LAB-4988",
    date: "2026-08-11",
    time: "15:45",
    patientName: "Myra Bhandari",
    patientId: "P-12934",
    panels: ["Neonatal Screening Panel"],
    orderingDoctor: "Dr. Ananya Kapoor",
    status: "reported",
    tests: [
      { testName: "TSH (Neonatal)", normalRange: "<10 mIU/L", resultValue: "3.2 mIU/L", flag: "normal" },
      { testName: "PKU Screen", normalRange: "Negative", resultValue: "Negative", flag: "normal" },
    ],
    sample: { sampleType: "Heel-prick blood", collectedBy: "Nurse · Kavita J.", collectedAt: "11 Aug, 16:00" },
    timeline: [
      { title: "Report released", when: "18:20", tint: "emerald", icon: "checkmark-circle" },
      { title: "Processing complete", when: "17:50", tint: "blue", icon: "flask" },
      { title: "Sample collected", when: "16:00", tint: "blue", icon: "water" },
      { title: "Order received", subtitle: "Linked to IPD-7288", when: "15:45", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "lab-2026-0013",
    orderRef: "LAB-4922",
    date: "2026-08-10",
    time: "10:30",
    patientName: "Anaya Desai",
    patientId: "P-08401",
    panels: ["Vitamin D, Vitamin B12"],
    orderingDoctor: "Dr. Sana Fatima",
    status: "reported",
    tests: [
      { testName: "Vitamin D (25-OH)", normalRange: "30-100 ng/mL", resultValue: "14 ng/mL", flag: "low" },
      { testName: "Vitamin B12", normalRange: "200-900 pg/mL", resultValue: "410 pg/mL", flag: "normal" },
    ],
    sample: { sampleType: "Venous blood", collectedBy: "Phlebotomist · Sunita R.", collectedAt: "10 Aug, 10:42" },
    timeline: [
      { title: "Report released", when: "13:10", tint: "emerald", icon: "checkmark-circle" },
      { title: "Processing complete", when: "12:40", tint: "blue", icon: "flask" },
      { title: "Sample collected", when: "10:42", tint: "blue", icon: "water" },
      { title: "Order received", when: "10:30", tint: "slate", icon: "time" },
    ],
  },
];
