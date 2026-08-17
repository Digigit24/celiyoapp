/**
 * Admin module — staff/user administration demo data and shared constants.
 *
 * This is distinct from `src/features/settings/` (self-service settings for
 * the signed-in user's own preferences). Admin is for an administrator
 * managing OTHER staff accounts: roles, module access, activity.
 *
 * No backend exists yet for the Admin module (Phase 3). The constants below
 * are realistic-looking fixtures used by the hooks until the real
 * `./lib/api/admin` lands. When the API arrives, the hook swap is the only
 * change required — the screen contract stays stable.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { Ionicons } from "@expo/vector-icons";
import type { ChipVariant } from "../../components/ui";

export type StaffRole =
  | "doctor"
  | "nurse"
  | "receptionist"
  | "cashier"
  | "pharmacist"
  | "lab_technician"
  | "admin";

export type StaffStatus = "active" | "inactive" | "invited";

export interface StaffActivityEvent {
  title: string;
  subtitle?: string;
  when: string;
  tint: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  icon?: keyof typeof Ionicons.glyphMap;
}

export interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  role: StaffRole;
  status: StaffStatus;
  department: string;
  email: string;
  phone: string;
  joinedDate: string;
  lastActiveDate: string;
  /** Module access grants — rendered as read-only Chips. */
  permissions: string[];
  timeline: StaffActivityEvent[];
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  cashier: "Cashier",
  pharmacist: "Pharmacist",
  lab_technician: "Lab Technician",
  admin: "Admin",
};

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  invited: "Invited",
};

export const STAFF_STATUS_CHIP_VARIANT: Record<StaffStatus, ChipVariant> = {
  active: "success",
  inactive: "neutral",
  invited: "warning",
};

export const STAFF_FILTER_OPTIONS: Array<{ id: "all" | StaffStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "invited", label: "Invited" },
  { id: "inactive", label: "Inactive" },
];

/** "17 Aug 2026" display format for an ISO yyyy-mm-dd date. */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${d} ${months[m - 1] ?? "—"} ${y}`;
}

/** Reference "today" for tenure/last-active math — mirrors the environment's current date. */
export const TODAY_ISO = "2026-08-17";

/** Whole days between an ISO date and `today` (positive when in the past). */
export function daysSince(date: string, today: string = TODAY_ISO): number {
  const toDays = (iso: string) => {
    const [y, m, d] = iso.split("-").map((n) => Number.parseInt(n, 10));
    return Date.UTC(y, m - 1, d) / 86_400_000;
  };
  return Math.round(toDays(today) - toDays(date));
}

/** "3y 2m" style tenure string from a join date. */
export function formatTenure(joinedDate: string, today: string = TODAY_ISO): string {
  const [jy, jm, jd] = joinedDate.split("-").map((n) => Number.parseInt(n, 10));
  const [ty, tm, td] = today.split("-").map((n) => Number.parseInt(n, 10));
  let years = ty - jy;
  let months = tm - jm;
  if (td < jd) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0 && months <= 0) return "New";
  if (years <= 0) return `${months}m`;
  return `${years}y ${months}m`;
}

// __demo: true — placeholder fixtures used until the admin API is wired.
export const DEMO_STAFF: StaffMember[] = [
  {
    id: "staff-0001",
    employeeId: "EMP-1001",
    name: "Dr. Nikhil Mehta",
    role: "doctor",
    status: "active",
    department: "General Medicine",
    email: "nikhil.mehta@celiyohospital.in",
    phone: "+91 98200 11234",
    joinedDate: "2021-04-12",
    lastActiveDate: "2026-08-17",
    permissions: ["OPD", "IPD", "Clinical Records", "Patients"],
    timeline: [
      { title: "Account created", subtitle: "Onboarded by HR", when: "12 Apr 2021", tint: "slate", icon: "person-add" },
      { title: "Role changed", subtitle: "Resident → Consultant", when: "3 Jan 2023", tint: "blue", icon: "swap-horizontal" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 08:40", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0002",
    employeeId: "EMP-1002",
    name: "Dr. Ananya Kapoor",
    role: "doctor",
    status: "active",
    department: "Obstetrics & Gynaecology",
    email: "ananya.kapoor@celiyohospital.in",
    phone: "+91 98330 22456",
    joinedDate: "2020-09-01",
    lastActiveDate: "2026-08-17",
    permissions: ["OPD", "IPD", "Daycare", "Clinical Records"],
    timeline: [
      { title: "Account created", when: "1 Sep 2020", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Web portal", when: "17 Aug, 07:55", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0003",
    employeeId: "EMP-1140",
    name: "Priya Mahajan",
    role: "cashier",
    status: "active",
    department: "Billing",
    email: "priya.mahajan@celiyohospital.in",
    phone: "+91 97400 55678",
    joinedDate: "2023-02-15",
    lastActiveDate: "2026-08-17",
    permissions: ["Payments", "OPD", "IPD"],
    timeline: [
      { title: "Account created", when: "15 Feb 2023", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 09:15", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0004",
    employeeId: "EMP-1141",
    name: "Anita Rane",
    role: "cashier",
    status: "active",
    department: "Billing",
    email: "anita.rane@celiyohospital.in",
    phone: "+91 97400 55679",
    joinedDate: "2022-11-20",
    lastActiveDate: "2026-08-16",
    permissions: ["Payments", "IPD"],
    timeline: [
      { title: "Account created", when: "20 Nov 2022", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Web portal", when: "16 Aug, 18:20", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0005",
    employeeId: "EMP-1210",
    name: "Suresh Nair",
    role: "pharmacist",
    status: "active",
    department: "Pharmacy",
    email: "suresh.nair@celiyohospital.in",
    phone: "+91 96200 33221",
    joinedDate: "2021-07-08",
    lastActiveDate: "2026-08-17",
    permissions: ["Pharmacy", "Inventory"],
    timeline: [
      { title: "Account created", when: "8 Jul 2021", tint: "slate", icon: "person-add" },
      { title: "Role changed", subtitle: "Pharmacy Assistant → Pharmacist", when: "1 Apr 2024", tint: "blue", icon: "swap-horizontal" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 10:05", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0006",
    employeeId: "EMP-1211",
    name: "Meena Kulkarni",
    role: "pharmacist",
    status: "active",
    department: "Pharmacy",
    email: "meena.kulkarni@celiyohospital.in",
    phone: "+91 96200 33222",
    joinedDate: "2022-05-30",
    lastActiveDate: "2026-08-17",
    permissions: ["Pharmacy"],
    timeline: [
      { title: "Account created", when: "30 May 2022", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 08:20", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0007",
    employeeId: "EMP-1305",
    name: "Anil Kadam",
    role: "lab_technician",
    status: "active",
    department: "Laboratory",
    email: "anil.kadam@celiyohospital.in",
    phone: "+91 95940 44112",
    joinedDate: "2020-01-14",
    lastActiveDate: "2026-08-17",
    permissions: ["Lab", "Inventory"],
    timeline: [
      { title: "Account created", when: "14 Jan 2020", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 09:35", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0008",
    employeeId: "EMP-1306",
    name: "Sunita Rathod",
    role: "lab_technician",
    status: "inactive",
    department: "Laboratory",
    email: "sunita.rathod@celiyohospital.in",
    phone: "+91 95940 44113",
    joinedDate: "2019-06-02",
    lastActiveDate: "2026-06-30",
    permissions: ["Lab"],
    timeline: [
      { title: "Account created", when: "2 Jun 2019", tint: "slate", icon: "person-add" },
      { title: "Account deactivated", subtitle: "Long leave of absence", when: "1 Jul 2026", tint: "rose", icon: "person-remove" },
      { title: "Last login", subtitle: "Mobile app", when: "30 Jun, 17:40", tint: "slate", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0009",
    employeeId: "EMP-1402",
    name: "Kavita Joshi",
    role: "nurse",
    status: "active",
    department: "IPD Ward — 3rd Floor",
    email: "kavita.joshi@celiyohospital.in",
    phone: "+91 94220 66334",
    joinedDate: "2021-10-11",
    lastActiveDate: "2026-08-17",
    permissions: ["IPD", "OPD", "Clinical Records"],
    timeline: [
      { title: "Account created", when: "11 Oct 2021", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 07:10", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0010",
    employeeId: "EMP-1403",
    name: "Rekha Salunkhe",
    role: "nurse",
    status: "active",
    department: "ICU",
    email: "rekha.salunkhe@celiyohospital.in",
    phone: "+91 94220 66335",
    joinedDate: "2020-03-19",
    lastActiveDate: "2026-08-16",
    permissions: ["IPD", "Clinical Records"],
    timeline: [
      { title: "Account created", when: "19 Mar 2020", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Web portal", when: "16 Aug, 20:00", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0011",
    employeeId: "EMP-1508",
    name: "Ritu Shah",
    role: "receptionist",
    status: "active",
    department: "Front Desk",
    email: "ritu.shah@celiyohospital.in",
    phone: "+91 93240 77889",
    joinedDate: "2023-08-01",
    lastActiveDate: "2026-08-17",
    permissions: ["Patients", "OPD"],
    timeline: [
      { title: "Account created", when: "1 Aug 2023", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 08:00", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0012",
    employeeId: "EMP-1509",
    name: "Farhan Ansari",
    role: "receptionist",
    status: "invited",
    department: "Front Desk",
    email: "farhan.ansari@celiyohospital.in",
    phone: "+91 93240 77890",
    joinedDate: "2026-08-10",
    lastActiveDate: "2026-08-10",
    permissions: ["Patients"],
    timeline: [
      { title: "Invitation sent", subtitle: "By Admin · S. Khanna", when: "10 Aug 2026", tint: "amber", icon: "mail-outline" },
    ],
  },
  {
    id: "staff-0013",
    employeeId: "EMP-1002-A",
    name: "Dr. Rajeev Kapoor",
    role: "doctor",
    status: "active",
    department: "Critical Care",
    email: "rajeev.kapoor@celiyohospital.in",
    phone: "+91 98450 88123",
    joinedDate: "2018-11-05",
    lastActiveDate: "2026-08-17",
    permissions: ["IPD", "Clinical Records", "Daycare"],
    timeline: [
      { title: "Account created", when: "5 Nov 2018", tint: "slate", icon: "person-add" },
      { title: "Role changed", subtitle: "Added ICU privileges", when: "12 Feb 2022", tint: "blue", icon: "swap-horizontal" },
      { title: "Last login", subtitle: "Mobile app", when: "17 Aug, 06:50", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0014",
    employeeId: "EMP-1610",
    name: "Sana Fatima",
    role: "doctor",
    status: "active",
    department: "Dermatology",
    email: "sana.fatima@celiyohospital.in",
    phone: "+91 99870 12987",
    joinedDate: "2022-01-20",
    lastActiveDate: "2026-08-14",
    permissions: ["OPD", "Clinical Records"],
    timeline: [
      { title: "Account created", when: "20 Jan 2022", tint: "slate", icon: "person-add" },
      { title: "Last login", subtitle: "Web portal", when: "14 Aug, 12:30", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0015",
    employeeId: "EMP-1701",
    name: "Sameer Khanna",
    role: "admin",
    status: "active",
    department: "Hospital Administration",
    email: "sameer.khanna@celiyohospital.in",
    phone: "+91 98200 99001",
    joinedDate: "2017-05-15",
    lastActiveDate: "2026-08-17",
    permissions: ["Admin", "Payments", "Inventory", "Reputation", "Settings"],
    timeline: [
      { title: "Account created", when: "15 May 2017", tint: "slate", icon: "person-add" },
      { title: "Role changed", subtitle: "Ops Manager → Admin", when: "1 Jan 2020", tint: "blue", icon: "swap-horizontal" },
      { title: "Last login", subtitle: "Web portal", when: "17 Aug, 09:00", tint: "emerald", icon: "log-in-outline" },
    ],
  },
  {
    id: "staff-0016",
    employeeId: "EMP-1142",
    name: "Rakesh Salvi",
    role: "cashier",
    status: "inactive",
    department: "Billing",
    email: "rakesh.salvi@celiyohospital.in",
    phone: "+91 97400 55680",
    joinedDate: "2019-09-09",
    lastActiveDate: "2026-05-02",
    permissions: ["Payments"],
    timeline: [
      { title: "Account created", when: "9 Sep 2019", tint: "slate", icon: "person-add" },
      { title: "Account deactivated", subtitle: "Transferred to sister branch", when: "3 May 2026", tint: "rose", icon: "person-remove" },
      { title: "Last login", subtitle: "Mobile app", when: "2 May, 14:10", tint: "slate", icon: "log-in-outline" },
    ],
  },
];
