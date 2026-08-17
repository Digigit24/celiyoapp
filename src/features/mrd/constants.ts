/**
 * MRD (Medical Records Department) module — demo data and shared constants.
 *
 * MRD tracks physical/digital file custody — who currently holds a patient's
 * case file, and its movement history (issued to a doctor/department,
 * returned, archived). This is distinct from the Clinical Records module
 * (`src/features/clinicalRecords/`), which indexes the clinical *content* of
 * a patient's records — MRD tracks the *file itself* as a physical/logical
 * object moving through custody.
 *
 * No backend exists yet for the MRD module. The constants below are
 * realistic-looking fixtures used by the hooks until a real
 * `./lib/api/mrd` lands. When the API arrives, the hook swap is the only
 * change required — the screen contract stays stable.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { ChipVariant } from "../../components/ui";

export type MrdFileStatus = "available" | "checked-out" | "in-transit" | "archived";

export interface MrdMovementEvent {
  title: string;
  subtitle?: string;
  when: string;
  tint: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  icon?:
    | "file-tray-full"
    | "arrow-redo"
    | "arrow-undo"
    | "checkmark-circle"
    | "archive"
    | "time";
}

export interface MrdFileRecord {
  id: string;
  fileNumber: string;
  patientName: string;
  patientId: string;
  currentCustody: string;
  status: MrdFileStatus;
  /** Date of the most recent movement (ISO yyyy-mm-dd). */
  lastMovementDate: string;
  /** Display time (HH:mm) for the most recent movement. */
  lastMovementTime: string;
  /** Number of physical volumes / folders in this file. */
  volumeCount: number;
  /** Where the file is permanently stored when not checked out. */
  storageLocation: string;
  movementTimeline: MrdMovementEvent[];
}

export const MRD_STATUS_LABELS: Record<MrdFileStatus, string> = {
  available: "Available",
  "checked-out": "Checked Out",
  "in-transit": "In Transit",
  archived: "Archived",
};

export const MRD_STATUS_CHIP_VARIANT: Record<MrdFileStatus, ChipVariant> = {
  available: "success",
  "checked-out": "warning",
  "in-transit": "info",
  archived: "neutral",
};

export const MRD_FILTER_OPTIONS: Array<{ id: "all" | MrdFileStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "available", label: "Available" },
  { id: "checked-out", label: "Checked Out" },
  { id: "in-transit", label: "In Transit" },
  { id: "archived", label: "Archived" },
];

/** Compact display label for a date — "17 Aug 2026". */
export function formatMrdDate(date: string): string {
  const [y, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = months[m - 1] ?? "—";
  return `${d} ${label} ${y}`;
}

// __demo: true — placeholder fixtures used until the MRD API is wired.
export const DEMO_MRD_FILES: MrdFileRecord[] = [
  {
    id: "mrd-2026-0001",
    fileNumber: "MRD-104521",
    patientName: "Aarav Sharma",
    patientId: "P-10234",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-16",
    lastMovementTime: "15:20",
    volumeCount: 2,
    storageLocation: "Rack B-14, Shelf 3",
    movementTimeline: [
      { title: "Requested", subtitle: "Dr. Mehta's OPD · Follow-up visit", when: "15 Aug, 09:00", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Dr. Mehta's OPD", when: "15 Aug, 09:15", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "16 Aug, 15:20", tint: "emerald", icon: "arrow-undo" },
    ],
  },
  {
    id: "mrd-2026-0002",
    fileNumber: "MRD-098213",
    patientName: "Diya Iyer",
    patientId: "P-09812",
    currentCustody: "Dr. Kapoor's IPD Ward",
    status: "checked-out",
    lastMovementDate: "2026-08-17",
    lastMovementTime: "09:10",
    volumeCount: 3,
    storageLocation: "Rack A-02, Shelf 1",
    movementTimeline: [
      { title: "Requested", subtitle: "IPD-7341 admission", when: "14 Aug, 08:30", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Dr. Kapoor's IPD Ward", when: "14 Aug, 08:50", tint: "amber", icon: "arrow-redo" },
      { title: "Still with ward", subtitle: "Active admission in progress", when: "17 Aug, 09:10", tint: "blue", icon: "time" },
    ],
  },
  {
    id: "mrd-2026-0003",
    fileNumber: "MRD-055230",
    patientName: "Rohan Verma",
    patientId: "P-11002",
    currentCustody: "Billing Dept",
    status: "in-transit",
    lastMovementDate: "2026-08-16",
    lastMovementTime: "18:40",
    volumeCount: 1,
    storageLocation: "Rack C-07, Shelf 2",
    movementTimeline: [
      { title: "Requested", subtitle: "Billing Dept · Insurance claim audit", when: "16 Aug, 17:50", tint: "slate", icon: "file-tray-full" },
      { title: "In transit", subtitle: "En route to Billing Dept", when: "16 Aug, 18:40", tint: "blue", icon: "arrow-redo" },
    ],
  },
  {
    id: "mrd-2026-0004",
    fileNumber: "MRD-077211",
    patientName: "Meera Pillai",
    patientId: "P-07721",
    currentCustody: "MRD Store",
    status: "archived",
    lastMovementDate: "2026-08-13",
    lastMovementTime: "11:00",
    volumeCount: 4,
    storageLocation: "Archive Room, Box 221",
    movementTimeline: [
      { title: "Requested", subtitle: "IPD-7199 discharge audit", when: "12 Aug, 10:00", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Quality Dept for audit", when: "12 Aug, 10:20", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "13 Aug, 10:40", tint: "emerald", icon: "arrow-undo" },
      { title: "Archived", subtitle: "Moved to long-term archive", when: "13 Aug, 11:00", tint: "slate", icon: "archive" },
    ],
  },
  {
    id: "mrd-2026-0005",
    fileNumber: "MRD-093110",
    patientName: "Kabir Reddy",
    patientId: "P-09311",
    currentCustody: "Pharmacy Dept",
    status: "checked-out",
    lastMovementDate: "2026-08-15",
    lastMovementTime: "11:05",
    volumeCount: 1,
    storageLocation: "Rack D-19, Shelf 4",
    movementTimeline: [
      { title: "Requested", subtitle: "Pharmacy Dept · Medication reconciliation", when: "15 Aug, 10:50", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Pharmacy Dept", when: "15 Aug, 11:05", tint: "amber", icon: "arrow-redo" },
    ],
  },
  {
    id: "mrd-2026-0006",
    fileNumber: "MRD-120080",
    patientName: "Saanvi Joshi",
    patientId: "P-12008",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-15",
    lastMovementTime: "17:00",
    volumeCount: 2,
    storageLocation: "Rack B-21, Shelf 1",
    movementTimeline: [
      { title: "Requested", subtitle: "Daycare Dept · Chemo session review", when: "15 Aug, 16:30", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Daycare Dept", when: "15 Aug, 16:38", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "15 Aug, 17:00", tint: "emerald", icon: "arrow-undo" },
    ],
  },
  {
    id: "mrd-2026-0007",
    fileNumber: "MRD-050518",
    patientName: "Yash Kulkarni",
    patientId: "P-05518",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-15",
    lastMovementTime: "13:30",
    volumeCount: 1,
    storageLocation: "Rack A-09, Shelf 2",
    movementTimeline: [
      { title: "Requested", subtitle: "Dr. Mehta's OPD · Follow-up", when: "15 Aug, 13:00", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Dr. Mehta's OPD", when: "15 Aug, 13:10", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "15 Aug, 13:30", tint: "emerald", icon: "arrow-undo" },
    ],
  },
  {
    id: "mrd-2026-0008",
    fileNumber: "MRD-118230",
    patientName: "Tara Bose",
    patientId: "P-11823",
    currentCustody: "Insurance Desk",
    status: "checked-out",
    lastMovementDate: "2026-08-15",
    lastMovementTime: "09:25",
    volumeCount: 2,
    storageLocation: "Rack C-11, Shelf 3",
    movementTimeline: [
      { title: "Requested", subtitle: "Insurance Desk · Pre-auth documentation", when: "15 Aug, 09:00", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Insurance Desk", when: "15 Aug, 09:25", tint: "amber", icon: "arrow-redo" },
    ],
  },
  {
    id: "mrd-2026-0009",
    fileNumber: "MRD-100290",
    patientName: "Arjun Nair",
    patientId: "P-10029",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-14",
    lastMovementTime: "18:00",
    volumeCount: 1,
    storageLocation: "Rack B-05, Shelf 4",
    movementTimeline: [
      { title: "Requested", subtitle: "Lab · Report correlation", when: "14 Aug, 17:30", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Lab Dept", when: "14 Aug, 17:45", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "14 Aug, 18:00", tint: "emerald", icon: "arrow-undo" },
    ],
  },
  {
    id: "mrd-2026-0010",
    fileNumber: "MRD-084010",
    patientName: "Anaya Desai",
    patientId: "P-08401",
    currentCustody: "MRD Store",
    status: "archived",
    lastMovementDate: "2026-08-11",
    lastMovementTime: "10:15",
    volumeCount: 1,
    storageLocation: "Archive Room, Box 198",
    movementTimeline: [
      { title: "Requested", subtitle: "Refund processing review", when: "10 Aug, 09:00", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Billing Dept", when: "10 Aug, 09:20", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "11 Aug, 09:50", tint: "emerald", icon: "arrow-undo" },
      { title: "Archived", subtitle: "Moved to long-term archive", when: "11 Aug, 10:15", tint: "slate", icon: "archive" },
    ],
  },
  {
    id: "mrd-2026-0011",
    fileNumber: "MRD-129340",
    patientName: "Myra Bhandari",
    patientId: "P-12934",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-14",
    lastMovementTime: "12:30",
    volumeCount: 3,
    storageLocation: "Rack A-16, Shelf 2",
    movementTimeline: [
      { title: "Requested", subtitle: "Maternity discharge audit", when: "13 Aug, 11:00", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Dr. Priya Sen's ward", when: "13 Aug, 11:20", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "14 Aug, 12:30", tint: "emerald", icon: "arrow-undo" },
    ],
  },
  {
    id: "mrd-2026-0012",
    fileNumber: "MRD-070020",
    patientName: "Atharv Tiwari",
    patientId: "P-07002",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-12",
    lastMovementTime: "16:10",
    volumeCount: 1,
    storageLocation: "Rack C-22, Shelf 1",
    movementTimeline: [
      { title: "Requested", subtitle: "Lab · Dengue result correlation", when: "12 Aug, 15:40", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Lab Dept", when: "12 Aug, 15:50", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "12 Aug, 16:10", tint: "emerald", icon: "arrow-undo" },
    ],
  },
  {
    id: "mrd-2026-0013",
    fileNumber: "MRD-067120",
    patientName: "Ishaan Kapoor",
    patientId: "P-06712",
    currentCustody: "ICU",
    status: "checked-out",
    lastMovementDate: "2026-08-18",
    lastMovementTime: "19:15",
    volumeCount: 2,
    storageLocation: "Rack A-01, Shelf 1",
    movementTimeline: [
      { title: "Requested", subtitle: "IPD-7301 · ICU admission", when: "13 Aug, 19:00", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To ICU", when: "13 Aug, 19:15", tint: "amber", icon: "arrow-redo" },
      { title: "Still with ICU", subtitle: "Active admission in progress", when: "18 Aug, 19:15", tint: "blue", icon: "time" },
    ],
  },
  {
    id: "mrd-2026-0014",
    fileNumber: "MRD-112900",
    patientName: "Priya Menon",
    patientId: "P-11290",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-13",
    lastMovementTime: "15:45",
    volumeCount: 2,
    storageLocation: "Rack B-08, Shelf 3",
    movementTimeline: [
      { title: "Requested", subtitle: "Pharmacy · Medication history", when: "13 Aug, 15:10", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Pharmacy Dept", when: "13 Aug, 15:20", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "13 Aug, 15:45", tint: "emerald", icon: "arrow-undo" },
    ],
  },
  {
    id: "mrd-2026-0015",
    fileNumber: "MRD-044110",
    patientName: "Arnav Singh",
    patientId: "P-04411",
    currentCustody: "Billing Dept",
    status: "in-transit",
    lastMovementDate: "2026-08-13",
    lastMovementTime: "10:20",
    volumeCount: 1,
    storageLocation: "Rack D-03, Shelf 2",
    movementTimeline: [
      { title: "Requested", subtitle: "Billing Dept · Failed payment follow-up", when: "13 Aug, 10:05", tint: "slate", icon: "file-tray-full" },
      { title: "In transit", subtitle: "En route to Billing Dept", when: "13 Aug, 10:20", tint: "blue", icon: "arrow-redo" },
    ],
  },
  {
    id: "mrd-2026-0016",
    fileNumber: "MRD-129080",
    patientName: "Myra Bhandari",
    patientId: "P-12080",
    currentCustody: "MRD Store",
    status: "archived",
    lastMovementDate: "2026-08-10",
    lastMovementTime: "09:00",
    volumeCount: 1,
    storageLocation: "Archive Room, Box 176",
    movementTimeline: [
      { title: "Requested", subtitle: "Routine closure after 6 months inactive", when: "09 Aug, 08:30", tint: "slate", icon: "file-tray-full" },
      { title: "Archived", subtitle: "Moved to long-term archive", when: "10 Aug, 09:00", tint: "slate", icon: "archive" },
    ],
  },
  {
    id: "mrd-2026-0017",
    fileNumber: "MRD-131010",
    patientName: "Veer Choudhury",
    patientId: "P-13101",
    currentCustody: "MRD Store",
    status: "available",
    lastMovementDate: "2026-08-14",
    lastMovementTime: "09:20",
    volumeCount: 1,
    storageLocation: "Rack A-25, Shelf 4",
    movementTimeline: [
      { title: "Requested", subtitle: "Tele-consultation follow-up", when: "14 Aug, 08:56", tint: "slate", icon: "file-tray-full" },
      { title: "Issued", subtitle: "To Dr. Mehta's OPD (virtual)", when: "14 Aug, 09:00", tint: "amber", icon: "arrow-redo" },
      { title: "Returned", subtitle: "To MRD Store", when: "14 Aug, 09:20", tint: "emerald", icon: "arrow-undo" },
    ],
  },
];

/**
 * Quick aggregate numbers shown in the QuickStats row of the detail screen.
 * Real values would come from the API; for demo we compute deterministic
 * totals so the row looks plausible.
 */
export const DEMO_MRD_QUICK_STATS = {
  totalFiles: 3820,
  checkedOut: 47,
  inTransit: 6,
  archivedThisMonth: 112,
};
