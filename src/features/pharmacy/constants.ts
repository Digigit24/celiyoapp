/**
 * Pharmacy module — demo data and shared constants.
 *
 * No backend exists yet for the Pharmacy module (Phase 3). The constants
 * below are realistic-looking fixtures used by the hooks until the real
 * `./lib/api/pharmacy` lands. When the API arrives, the hook swap is the
 * only change required — the screen contract stays stable.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { Ionicons } from "@expo/vector-icons";
import type { ChipVariant } from "../../components/ui";

export type DispensingStatus = "pending" | "partial" | "dispensed" | "cancelled";

export type StockAvailability = "in-stock" | "low-stock" | "out-of-stock";

export interface PrescriptionDrugLine {
  drugName: string;
  strength: string;
  qtyOrdered: number;
  qtyDispensed: number;
  unit: string;
  availability: StockAvailability;
}

export interface PharmacyTimelineEvent {
  title: string;
  subtitle?: string;
  when: string;
  tint: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface PharmacyOrder {
  id: string;
  orderRef: string;
  date: string;
  time: string;
  patientName: string;
  patientId: string;
  prescribingDoctor: string;
  status: DispensingStatus;
  items: PrescriptionDrugLine[];
  timeline: PharmacyTimelineEvent[];
}

export const DISPENSING_STATUS_LABELS: Record<DispensingStatus, string> = {
  pending: "Pending",
  partial: "Partially dispensed",
  dispensed: "Dispensed",
  cancelled: "Cancelled",
};

export const DISPENSING_STATUS_CHIP_VARIANT: Record<DispensingStatus, ChipVariant> = {
  pending: "warning",
  partial: "info",
  dispensed: "success",
  cancelled: "danger",
};

export const PHARMACY_FILTER_OPTIONS: Array<{ id: "all" | DispensingStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "partial", label: "Partial" },
  { id: "dispensed", label: "Dispensed" },
  { id: "cancelled", label: "Cancelled" },
];

export const STOCK_AVAILABILITY_LABELS: Record<StockAvailability, string> = {
  "in-stock": "In stock",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
};

export const STOCK_AVAILABILITY_CHIP_VARIANT: Record<StockAvailability, ChipVariant> = {
  "in-stock": "success",
  "low-stock": "warning",
  "out-of-stock": "danger",
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

// __demo: true — placeholder fixtures used until the pharmacy API is wired.
export const DEMO_PHARMACY_ORDERS: PharmacyOrder[] = [
  {
    id: "rx-2026-0001",
    orderRef: "RX-2026-0001",
    date: "2026-08-17",
    time: "10:12",
    patientName: "Aarav Sharma",
    patientId: "P-10234",
    prescribingDoctor: "Dr. Nikhil Mehta",
    status: "dispensed",
    items: [
      { drugName: "Amoxicillin", strength: "500mg", qtyOrdered: 15, qtyDispensed: 15, unit: "capsules", availability: "in-stock" },
      { drugName: "Paracetamol", strength: "650mg", qtyOrdered: 10, qtyDispensed: 10, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", subtitle: "Pharmacist · Suresh N.", when: "10:40", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", subtitle: "All items picked", when: "10:32", tint: "blue", icon: "medkit" },
      { title: "Stock checked", subtitle: "Both items available", when: "10:20", tint: "slate", icon: "cube" },
      { title: "Order received", subtitle: "Linked to OPD-9821", when: "10:12", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0002",
    orderRef: "RX-2026-0002",
    date: "2026-08-17",
    time: "09:48",
    patientName: "Diya Iyer",
    patientId: "P-09812",
    prescribingDoctor: "Dr. Ananya Kapoor",
    status: "partial",
    items: [
      { drugName: "Insulin Glargine", strength: "100IU/ml", qtyOrdered: 2, qtyDispensed: 1, unit: "vials", availability: "low-stock" },
      { drugName: "Metformin", strength: "500mg", qtyOrdered: 30, qtyDispensed: 30, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Partially dispensed", subtitle: "1 of 2 insulin vials issued", when: "09:58", tint: "amber", icon: "hourglass" },
      { title: "Stock checked", subtitle: "Insulin low — reorder flagged", when: "09:52", tint: "slate", icon: "cube" },
      { title: "Order received", subtitle: "Linked to IPD-7341", when: "09:48", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0003",
    orderRef: "RX-2026-0003",
    date: "2026-08-16",
    time: "18:02",
    patientName: "Rohan Verma",
    patientId: "P-11002",
    prescribingDoctor: "Dr. Nikhil Mehta",
    status: "dispensed",
    items: [
      { drugName: "Cetirizine", strength: "10mg", qtyOrdered: 10, qtyDispensed: 10, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", subtitle: "Pharmacist · Meena K.", when: "18:20", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", when: "18:15", tint: "blue", icon: "medkit" },
      { title: "Order received", when: "18:02", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0004",
    orderRef: "RX-2026-0004",
    date: "2026-08-16",
    time: "14:10",
    patientName: "Meera Pillai",
    patientId: "P-07721",
    prescribingDoctor: "Dr. Rajeev Kapoor",
    status: "pending",
    items: [
      { drugName: "Ceftriaxone", strength: "1g injection", qtyOrdered: 6, qtyDispensed: 0, unit: "vials", availability: "in-stock" },
      { drugName: "Ondansetron", strength: "4mg", qtyOrdered: 12, qtyDispensed: 0, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Order received", subtitle: "Linked to IPD-7199", when: "14:10", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0005",
    orderRef: "RX-2026-0005",
    date: "2026-08-16",
    time: "11:20",
    patientName: "Kabir Reddy",
    patientId: "P-09311",
    prescribingDoctor: "Dr. Sana Fatima",
    status: "cancelled",
    items: [
      { drugName: "Azithromycin", strength: "250mg", qtyOrdered: 6, qtyDispensed: 0, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Order cancelled", subtitle: "Patient switched pharmacy", when: "11:35", tint: "rose", icon: "close-circle" },
      { title: "Order received", when: "11:20", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0006",
    orderRef: "RX-2026-0006",
    date: "2026-08-15",
    time: "16:22",
    patientName: "Saanvi Joshi",
    patientId: "P-12008",
    prescribingDoctor: "Dr. Ananya Kapoor",
    status: "dispensed",
    items: [
      { drugName: "Ondansetron", strength: "8mg injection", qtyOrdered: 4, qtyDispensed: 4, unit: "ampoules", availability: "in-stock" },
      { drugName: "Dexamethasone", strength: "4mg injection", qtyOrdered: 2, qtyDispensed: 2, unit: "ampoules", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", subtitle: "Nurse escort · Daycare", when: "16:40", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", when: "16:34", tint: "blue", icon: "medkit" },
      { title: "Order received", when: "16:22", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0007",
    orderRef: "RX-2026-0007",
    date: "2026-08-15",
    time: "13:05",
    patientName: "Yash Kulkarni",
    patientId: "P-05518",
    prescribingDoctor: "Dr. Nikhil Mehta",
    status: "dispensed",
    items: [
      { drugName: "Ibuprofen", strength: "400mg", qtyOrdered: 10, qtyDispensed: 10, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", when: "13:18", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", when: "13:14", tint: "blue", icon: "medkit" },
      { title: "Order received", when: "13:05", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0008",
    orderRef: "RX-2026-0008",
    date: "2026-08-15",
    time: "09:11",
    patientName: "Tara Bose",
    patientId: "P-11823",
    prescribingDoctor: "Dr. Rajeev Kapoor",
    status: "partial",
    items: [
      { drugName: "Enoxaparin", strength: "40mg injection", qtyOrdered: 5, qtyDispensed: 2, unit: "syringes", availability: "out-of-stock" },
      { drugName: "Pantoprazole", strength: "40mg", qtyOrdered: 5, qtyDispensed: 5, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Partially dispensed", subtitle: "Enoxaparin out of stock — 3 pending", when: "09:32", tint: "amber", icon: "hourglass" },
      { title: "Stock checked", subtitle: "Enoxaparin flagged out of stock", when: "09:18", tint: "slate", icon: "cube" },
      { title: "Order received", when: "09:11", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0009",
    orderRef: "RX-2026-0009",
    date: "2026-08-14",
    time: "17:30",
    patientName: "Arjun Nair",
    patientId: "P-10029",
    prescribingDoctor: "Dr. Sana Fatima",
    status: "dispensed",
    items: [
      { drugName: "Atorvastatin", strength: "20mg", qtyOrdered: 30, qtyDispensed: 30, unit: "tablets", availability: "in-stock" },
      { drugName: "Aspirin", strength: "75mg", qtyOrdered: 30, qtyDispensed: 30, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", when: "17:48", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", when: "17:44", tint: "blue", icon: "medkit" },
      { title: "Order received", when: "17:30", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0010",
    orderRef: "RX-2026-0010",
    date: "2026-08-14",
    time: "12:02",
    patientName: "Anaya Desai",
    patientId: "P-08401",
    prescribingDoctor: "Dr. Nikhil Mehta",
    status: "pending",
    items: [
      { drugName: "Diclofenac gel", strength: "1%", qtyOrdered: 1, qtyDispensed: 0, unit: "tube", availability: "in-stock" },
    ],
    timeline: [
      { title: "Order received", subtitle: "Linked to OPD-9691", when: "12:02", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0011",
    orderRef: "RX-2026-0011",
    date: "2026-08-14",
    time: "08:40",
    patientName: "Veer Choudhury",
    patientId: "P-13101",
    prescribingDoctor: "Dr. Ananya Kapoor",
    status: "dispensed",
    items: [
      { drugName: "Amoxiclav", strength: "625mg", qtyOrdered: 10, qtyDispensed: 10, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", when: "08:58", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", when: "08:54", tint: "blue", icon: "medkit" },
      { title: "Order received", when: "08:40", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0012",
    orderRef: "RX-2026-0012",
    date: "2026-08-13",
    time: "19:00",
    patientName: "Ishaan Kapoor",
    patientId: "P-06712",
    prescribingDoctor: "Dr. Rajeev Kapoor",
    status: "partial",
    items: [
      { drugName: "Piperacillin-Tazobactam", strength: "4.5g injection", qtyOrdered: 8, qtyDispensed: 4, unit: "vials", availability: "low-stock" },
      { drugName: "Furosemide", strength: "40mg", qtyOrdered: 5, qtyDispensed: 5, unit: "tablets", availability: "in-stock" },
    ],
    timeline: [
      { title: "Partially dispensed", subtitle: "ICU antibiotic — 4 vials pending restock", when: "19:22", tint: "amber", icon: "hourglass" },
      { title: "Stock checked", when: "19:08", tint: "slate", icon: "cube" },
      { title: "Order received", subtitle: "Linked to IPD-7301", when: "19:00", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0013",
    orderRef: "RX-2026-0013",
    date: "2026-08-13",
    time: "15:10",
    patientName: "Priya Menon",
    patientId: "P-11290",
    prescribingDoctor: "Dr. Sana Fatima",
    status: "dispensed",
    items: [
      { drugName: "Insulin Pen (Refill)", strength: "100IU/ml", qtyOrdered: 1, qtyDispensed: 1, unit: "pen", availability: "in-stock" },
      { drugName: "Glucose Test Strips", strength: "—", qtyOrdered: 50, qtyDispensed: 50, unit: "strips", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", when: "15:26", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", when: "15:22", tint: "blue", icon: "medkit" },
      { title: "Order received", when: "15:10", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0014",
    orderRef: "RX-2026-0014",
    date: "2026-08-12",
    time: "10:44",
    patientName: "Arnav Singh",
    patientId: "P-04411",
    prescribingDoctor: "Dr. Nikhil Mehta",
    status: "cancelled",
    items: [
      { drugName: "Isotretinoin", strength: "20mg", qtyOrdered: 30, qtyDispensed: 0, unit: "capsules", availability: "out-of-stock" },
    ],
    timeline: [
      { title: "Order cancelled", subtitle: "Out of stock — referred to partner pharmacy", when: "11:02", tint: "rose", icon: "close-circle" },
      { title: "Stock checked", subtitle: "Isotretinoin unavailable", when: "10:52", tint: "slate", icon: "cube" },
      { title: "Order received", when: "10:44", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "rx-2026-0015",
    orderRef: "RX-2026-0015",
    date: "2026-08-12",
    time: "08:15",
    patientName: "Myra Bhandari",
    patientId: "P-12934",
    prescribingDoctor: "Dr. Ananya Kapoor",
    status: "dispensed",
    items: [
      { drugName: "Folic Acid", strength: "5mg", qtyOrdered: 30, qtyDispensed: 30, unit: "tablets", availability: "in-stock" },
      { drugName: "Iron Sucrose", strength: "100mg injection", qtyOrdered: 3, qtyDispensed: 3, unit: "ampoules", availability: "in-stock" },
    ],
    timeline: [
      { title: "Handed to patient", when: "08:34", tint: "emerald", icon: "checkmark-circle" },
      { title: "Dispensed", when: "08:29", tint: "blue", icon: "medkit" },
      { title: "Order received", when: "08:15", tint: "slate", icon: "time" },
    ],
  },
];
