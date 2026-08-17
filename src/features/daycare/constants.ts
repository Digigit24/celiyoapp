/**
 * Daycare module — demo data and shared constants.
 *
 * No backend exists yet for the Daycare module. The constants below are
 * realistic-looking fixtures used by the hooks until a real
 * `./lib/api/daycare` lands. When the API arrives, the hook swap is the
 * only change required — the screen contract stays stable.
 *
 * Daycare covers short-stay sessions distinct from a full IPD admission:
 * chemo, dialysis, minor procedures, day observation — a patient checks in,
 * is seen, and checks out the same day without occupying an IPD bed.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { ChipVariant } from "../../components/ui";

export type DaycareSessionType =
  | "chemotherapy"
  | "dialysis"
  | "minor_procedure"
  | "day_observation"
  | "infusion_therapy"
  | "physiotherapy";

export type DaycareStatus =
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface DaycareVitalsSnapshot {
  bp: string;
  pulse: string;
  temp: string;
  spo2?: string;
  recordedAt: string;
}

export interface DaycareTimelineEvent {
  title: string;
  subtitle?: string;
  when: string;
  tint: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  icon?:
    | "calendar"
    | "log-in"
    | "pulse"
    | "checkmark-circle"
    | "close-circle"
    | "time"
    | "medkit";
}

export interface DaycareSession {
  id: string;
  sessionRef: string;
  patientName: string;
  patientId: string;
  sessionType: DaycareSessionType;
  /** Scheduled date (ISO yyyy-mm-dd). */
  date: string;
  /** Time slot label, e.g. "09:00 – 11:00". */
  timeSlot: string;
  bedOrChair: string;
  status: DaycareStatus;
  attendingDoctor: string;
  notes: string;
  vitals?: DaycareVitalsSnapshot;
  timeline: DaycareTimelineEvent[];
}

export const DAYCARE_SESSION_TYPE_LABELS: Record<DaycareSessionType, string> = {
  chemotherapy: "Chemotherapy",
  dialysis: "Dialysis",
  minor_procedure: "Minor Procedure",
  day_observation: "Day Observation",
  infusion_therapy: "Infusion Therapy",
  physiotherapy: "Physiotherapy",
};

export const DAYCARE_STATUS_LABELS: Record<DaycareStatus, string> = {
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const DAYCARE_STATUS_CHIP_VARIANT: Record<DaycareStatus, ChipVariant> = {
  scheduled: "info",
  "in-progress": "warning",
  completed: "success",
  cancelled: "danger",
};

export const DAYCARE_FILTER_OPTIONS: Array<{ id: "all" | DaycareStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "scheduled", label: "Scheduled" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

/** Compact display label for a date — "17 Aug 2026". */
export function formatDaycareDate(date: string): string {
  const [y, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = months[m - 1] ?? "—";
  return `${d} ${label} ${y}`;
}

// __demo: true — placeholder fixtures used until the daycare API is wired.
export const DEMO_DAYCARE_SESSIONS: DaycareSession[] = [
  {
    id: "dc-2026-0001",
    sessionRef: "DC-2310",
    patientName: "Saanvi Joshi",
    patientId: "P-12008",
    sessionType: "chemotherapy",
    date: "2026-08-17",
    timeSlot: "09:00 – 13:00",
    bedOrChair: "Chemo Chair 3",
    status: "in-progress",
    attendingDoctor: "Dr. Kavita Mehta",
    notes: "Cycle 4 of 6 · FOLFOX regimen. Pre-medication given, tolerating well.",
    vitals: { bp: "122/78", pulse: "84", temp: "98.4°F", spo2: "98%", recordedAt: "08:52" },
    timeline: [
      { title: "Scheduled", subtitle: "Booked via OPD follow-up", when: "15 Aug, 10:20", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "08:40", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Chemo Chair 3 · Dr. Mehta", when: "09:00", tint: "amber", icon: "pulse" },
    ],
  },
  {
    id: "dc-2026-0002",
    sessionRef: "DC-2311",
    patientName: "Ramesh Nair",
    patientId: "P-08823",
    sessionType: "dialysis",
    date: "2026-08-17",
    timeSlot: "07:00 – 10:00",
    bedOrChair: "Dialysis Bed 2",
    status: "completed",
    attendingDoctor: "Dr. Arvind Rao",
    notes: "Routine haemodialysis, 3rd session this week. No complications.",
    vitals: { bp: "138/86", pulse: "76", temp: "98.2°F", spo2: "97%", recordedAt: "06:55" },
    timeline: [
      { title: "Scheduled", subtitle: "Recurring weekly slot", when: "10 Aug, 09:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "06:48", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Dialysis Bed 2", when: "07:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Discharged, next session Fri", when: "09:58", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0003",
    sessionRef: "DC-2312",
    patientName: "Aditi Ghosh",
    patientId: "P-11455",
    sessionType: "minor_procedure",
    date: "2026-08-17",
    timeSlot: "11:30 – 12:30",
    bedOrChair: "Procedure Bay 1",
    status: "scheduled",
    attendingDoctor: "Dr. Sameer Khanna",
    notes: "Incision & drainage, left forearm abscess. Consent pending.",
    vitals: undefined,
    timeline: [
      { title: "Scheduled", subtitle: "Booked via OPD", when: "16 Aug, 15:10", tint: "slate", icon: "calendar" },
    ],
  },
  {
    id: "dc-2026-0004",
    sessionRef: "DC-2313",
    patientName: "Neha Kulkarni",
    patientId: "P-09902",
    sessionType: "day_observation",
    date: "2026-08-16",
    timeSlot: "10:00 – 16:00",
    bedOrChair: "Observation Bay 4",
    status: "completed",
    attendingDoctor: "Dr. Priya Sen",
    notes: "Post-endoscopy observation. Vitals stable, discharged same day.",
    vitals: { bp: "116/74", pulse: "72", temp: "98.0°F", spo2: "99%", recordedAt: "10:10" },
    timeline: [
      { title: "Scheduled", subtitle: "Post-procedure observation", when: "16 Aug, 09:30", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "10:00", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Observation Bay 4", when: "10:05", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Discharged, stable", when: "16:02", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0005",
    sessionRef: "DC-2314",
    patientName: "Farhan Sheikh",
    patientId: "P-13390",
    sessionType: "infusion_therapy",
    date: "2026-08-16",
    timeSlot: "13:00 – 15:00",
    bedOrChair: "Infusion Chair 1",
    status: "completed",
    attendingDoctor: "Dr. Kavita Mehta",
    notes: "Iron sucrose infusion for anaemia. Well tolerated.",
    vitals: { bp: "110/70", pulse: "80", temp: "98.6°F", spo2: "98%", recordedAt: "13:05" },
    timeline: [
      { title: "Scheduled", subtitle: "Booked via OPD follow-up", when: "14 Aug, 11:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "12:52", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Infusion Chair 1", when: "13:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "No adverse reaction", when: "14:50", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0006",
    sessionRef: "DC-2315",
    patientName: "Ishani Malhotra",
    patientId: "P-10771",
    sessionType: "physiotherapy",
    date: "2026-08-16",
    timeSlot: "08:30 – 09:15",
    bedOrChair: "PT Room 2",
    status: "cancelled",
    attendingDoctor: "Dr. Rohit Bansal",
    notes: "Patient rescheduled due to travel. No-show, rebooked for 19 Aug.",
    vitals: undefined,
    timeline: [
      { title: "Scheduled", subtitle: "Post-op knee physio, session 5", when: "12 Aug, 09:00", tint: "slate", icon: "calendar" },
      { title: "Cancelled", subtitle: "Patient requested reschedule", when: "08:20", tint: "rose", icon: "close-circle" },
    ],
  },
  {
    id: "dc-2026-0007",
    sessionRef: "DC-2316",
    patientName: "Vikram Chauhan",
    patientId: "P-07234",
    sessionType: "dialysis",
    date: "2026-08-15",
    timeSlot: "07:00 – 10:00",
    bedOrChair: "Dialysis Bed 1",
    status: "completed",
    attendingDoctor: "Dr. Arvind Rao",
    notes: "Routine haemodialysis. BP slightly elevated pre-session, monitored throughout.",
    vitals: { bp: "144/90", pulse: "82", temp: "98.3°F", spo2: "97%", recordedAt: "06:50" },
    timeline: [
      { title: "Scheduled", subtitle: "Recurring weekly slot", when: "08 Aug, 09:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "06:45", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Dialysis Bed 1", when: "07:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Stable, next session Mon", when: "09:55", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0008",
    sessionRef: "DC-2317",
    patientName: "Pooja Agarwal",
    patientId: "P-12660",
    sessionType: "chemotherapy",
    date: "2026-08-15",
    timeSlot: "10:00 – 14:00",
    bedOrChair: "Chemo Chair 1",
    status: "completed",
    attendingDoctor: "Dr. Kavita Mehta",
    notes: "Cycle 2 of 6 · AC regimen. Mild nausea, managed with antiemetics.",
    vitals: { bp: "118/76", pulse: "88", temp: "99.1°F", spo2: "98%", recordedAt: "09:45" },
    timeline: [
      { title: "Scheduled", subtitle: "Booked via OPD follow-up", when: "10 Aug, 14:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "09:40", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Chemo Chair 1 · Dr. Mehta", when: "10:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Discharged with home-care sheet", when: "13:58", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0009",
    sessionRef: "DC-2318",
    patientName: "Karan Malhotra",
    patientId: "P-06987",
    sessionType: "minor_procedure",
    date: "2026-08-14",
    timeSlot: "15:00 – 15:45",
    bedOrChair: "Procedure Bay 2",
    status: "completed",
    attendingDoctor: "Dr. Sameer Khanna",
    notes: "Suture removal, post-appendectomy. Wound healing well.",
    vitals: { bp: "120/80", pulse: "74", temp: "98.1°F", spo2: "99%", recordedAt: "15:00" },
    timeline: [
      { title: "Scheduled", subtitle: "Follow-up from IPD-7199", when: "07 Aug, 12:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "14:52", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Procedure Bay 2", when: "15:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "No complications", when: "15:40", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0010",
    sessionRef: "DC-2319",
    patientName: "Sneha Reddy",
    patientId: "P-14021",
    sessionType: "day_observation",
    date: "2026-08-14",
    timeSlot: "09:00 – 17:00",
    bedOrChair: "Observation Bay 2",
    status: "completed",
    attendingDoctor: "Dr. Priya Sen",
    notes: "Post-cataract day-care surgery observation. Stable throughout.",
    vitals: { bp: "112/72", pulse: "70", temp: "97.9°F", spo2: "99%", recordedAt: "09:15" },
    timeline: [
      { title: "Scheduled", subtitle: "Day-care cataract surgery", when: "05 Aug, 10:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "08:50", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Observation Bay 2", when: "09:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Discharged, eye shield advised", when: "16:55", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0011",
    sessionRef: "DC-2320",
    patientName: "Aryan Kapoor",
    patientId: "P-05601",
    sessionType: "infusion_therapy",
    date: "2026-08-13",
    timeSlot: "12:00 – 13:30",
    bedOrChair: "Infusion Chair 2",
    status: "completed",
    attendingDoctor: "Dr. Kavita Mehta",
    notes: "IVIG infusion for autoimmune condition. Rate titrated up gradually.",
    vitals: { bp: "124/80", pulse: "78", temp: "98.5°F", spo2: "98%", recordedAt: "11:55" },
    timeline: [
      { title: "Scheduled", subtitle: "Monthly IVIG cycle", when: "05 Aug, 09:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "11:50", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Infusion Chair 2", when: "12:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "No reaction, well tolerated", when: "13:25", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0012",
    sessionRef: "DC-2321",
    patientName: "Meher Bhatt",
    patientId: "P-11987",
    sessionType: "physiotherapy",
    date: "2026-08-13",
    timeSlot: "16:00 – 16:45",
    bedOrChair: "PT Room 1",
    status: "completed",
    attendingDoctor: "Dr. Rohit Bansal",
    notes: "Post-op shoulder physio, session 3 of 8. Good ROM progress.",
    vitals: { bp: "118/78", pulse: "76", temp: "98.2°F", spo2: "99%", recordedAt: "16:00" },
    timeline: [
      { title: "Scheduled", subtitle: "Weekly physio plan", when: "06 Aug, 16:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "15:55", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "PT Room 1", when: "16:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Next session 20 Aug", when: "16:42", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0013",
    sessionRef: "DC-2322",
    patientName: "Tanvi Deshpande",
    patientId: "P-09456",
    sessionType: "dialysis",
    date: "2026-08-12",
    timeSlot: "07:00 – 10:00",
    bedOrChair: "Dialysis Bed 3",
    status: "cancelled",
    attendingDoctor: "Dr. Arvind Rao",
    notes: "Patient admitted to IPD overnight for fever workup — session deferred.",
    vitals: undefined,
    timeline: [
      { title: "Scheduled", subtitle: "Recurring weekly slot", when: "05 Aug, 09:00", tint: "slate", icon: "calendar" },
      { title: "Cancelled", subtitle: "Diverted to IPD admission", when: "06:40", tint: "rose", icon: "close-circle" },
    ],
  },
  {
    id: "dc-2026-0014",
    sessionRef: "DC-2323",
    patientName: "Devansh Oberoi",
    patientId: "P-13877",
    sessionType: "minor_procedure",
    date: "2026-08-18",
    timeSlot: "10:00 – 10:30",
    bedOrChair: "Procedure Bay 1",
    status: "scheduled",
    attendingDoctor: "Dr. Sameer Khanna",
    notes: "Mole excision, upper back. Local anaesthesia planned.",
    vitals: undefined,
    timeline: [
      { title: "Scheduled", subtitle: "Booked via OPD", when: "17 Aug, 11:40", tint: "slate", icon: "calendar" },
    ],
  },
  {
    id: "dc-2026-0015",
    sessionRef: "DC-2324",
    patientName: "Riya Chatterjee",
    patientId: "P-08129",
    sessionType: "chemotherapy",
    date: "2026-08-18",
    timeSlot: "09:00 – 12:30",
    bedOrChair: "Chemo Chair 2",
    status: "scheduled",
    attendingDoctor: "Dr. Kavita Mehta",
    notes: "Cycle 5 of 6 · FOLFOX regimen. Pre-medication to be given at check-in.",
    vitals: undefined,
    timeline: [
      { title: "Scheduled", subtitle: "Recurring 3-weekly cycle", when: "28 Jul, 10:00", tint: "slate", icon: "calendar" },
    ],
  },
  {
    id: "dc-2026-0016",
    sessionRef: "DC-2325",
    patientName: "Om Prakash",
    patientId: "P-04520",
    sessionType: "day_observation",
    date: "2026-08-12",
    timeSlot: "08:00 – 14:00",
    bedOrChair: "Observation Bay 1",
    status: "completed",
    attendingDoctor: "Dr. Priya Sen",
    notes: "Post-colonoscopy observation. Mild bloating, resolved before discharge.",
    vitals: { bp: "126/82", pulse: "80", temp: "98.4°F", spo2: "98%", recordedAt: "08:10" },
    timeline: [
      { title: "Scheduled", subtitle: "Post-endoscopy observation", when: "12 Aug, 07:30", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "07:52", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Observation Bay 1", when: "08:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Discharged, stable", when: "13:50", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0017",
    sessionRef: "DC-2326",
    patientName: "Ananya Krishnan",
    patientId: "P-15002",
    sessionType: "infusion_therapy",
    date: "2026-08-11",
    timeSlot: "11:00 – 12:00",
    bedOrChair: "Infusion Chair 3",
    status: "completed",
    attendingDoctor: "Dr. Kavita Mehta",
    notes: "Zoledronic acid infusion for osteoporosis. Uneventful.",
    vitals: { bp: "114/74", pulse: "72", temp: "98.0°F", spo2: "99%", recordedAt: "10:55" },
    timeline: [
      { title: "Scheduled", subtitle: "Annual bone infusion", when: "01 Aug, 09:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "10:50", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "Infusion Chair 3", when: "11:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "No adverse reaction", when: "11:55", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "dc-2026-0018",
    sessionRef: "DC-2327",
    patientName: "Yuvraj Solanki",
    patientId: "P-02233",
    sessionType: "physiotherapy",
    date: "2026-08-11",
    timeSlot: "17:00 – 17:45",
    bedOrChair: "PT Room 2",
    status: "completed",
    attendingDoctor: "Dr. Rohit Bansal",
    notes: "Lower back physio, session 6 of 10. Pain score down to 3/10.",
    vitals: { bp: "122/80", pulse: "74", temp: "98.3°F", spo2: "99%", recordedAt: "17:00" },
    timeline: [
      { title: "Scheduled", subtitle: "Weekly physio plan", when: "04 Aug, 17:00", tint: "slate", icon: "calendar" },
      { title: "Checked in", subtitle: "Front desk · Reception", when: "16:55", tint: "blue", icon: "log-in" },
      { title: "In progress", subtitle: "PT Room 2", when: "17:00", tint: "amber", icon: "pulse" },
      { title: "Completed", subtitle: "Next session 18 Aug", when: "17:40", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
];

/**
 * Quick aggregate numbers shown in the QuickStats row of the detail screen.
 * Real values would come from the API; for demo we compute deterministic
 * totals so the row looks plausible.
 */
export const DEMO_DAYCARE_QUICK_STATS = {
  todaySessions: 3,
  inProgress: 1,
  completedThisWeek: 11,
  cancelledThisWeek: 2,
};
