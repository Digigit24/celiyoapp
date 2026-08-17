/**
 * Payments module — demo data and shared constants.
 *
 * No backend exists yet for the Payments module (Phase 3). The constants
 * below are realistic-looking fixtures used by the hooks until the real
 * `./lib/api/payments` lands. When the API arrives, the hook swap is the
 * only change required — the screen contract stays stable.
 *
 * __demo: true — these fixtures are placeholders, not production data.
 */

import type { ChipVariant } from "../../components/ui";

export type PaymentMethod =
  | "cash"
  | "upi"
  | "card"
  | "netbanking"
  | "wallet"
  | "insurance";

export type PaymentStatus = "paid" | "pending" | "refunded" | "failed";

export type PaymentRelatedModule = "opd" | "ipd" | "pharmacy" | "lab" | "daycare";

export interface PaymentBreakdownLine {
  label: string;
  /** Always stored in INR (₹). Whole numbers for cleanliness. */
  amount: number;
}

export interface PaymentTimelineEvent {
  /** Short verb (e.g. "Captured", "Refunded"). */
  title: string;
  /** Optional supporting line — actor, channel, note. */
  subtitle?: string;
  /** Relative or absolute time string. */
  when: string;
  /** Tint family for the dot/icon. */
  tint: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  /** Ionicons glyph for the timestamp dot. */
  icon?:
    | "card"
    | "checkmark-circle"
    | "refresh-circle"
    | "alert-circle"
    | "time"
    | "hourglass"
    | "shield-checkmark"
    | "wallet";
}

export interface PaymentTransaction {
  id: string;
  /** Internal transaction identifier — what the cashier would search for. */
  transactionRef: string;
  /** Date the patient settled the bill (ISO yyyy-mm-dd). */
  date: string;
  /** Display time (HH:mm), since we render date + time on the list. */
  time: string;
  patientName: string;
  patientId: string;
  /** Total amount in INR (₹). Whole numbers keep the list clean. */
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  /** What encounter this payment settled. */
  relatedModule: PaymentRelatedModule;
  relatedRef: string;
  /** Cashier who recorded the transaction. */
  receivedBy: string;
  /** Payer note — e.g. "Self", "Insurance: Star Health". */
  payer: string;
  /** Itemised lines for the detail screen. */
  breakdown: PaymentBreakdownLine[];
  /** Card / UPI / insurance reference, when applicable. */
  gatewayRef?: string;
  /** Transaction timeline events. */
  timeline: PaymentTimelineEvent[];
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
  wallet: "Wallet",
  insurance: "Insurance",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  refunded: "Refunded",
  failed: "Failed",
};

export const PAYMENT_STATUS_CHIP_VARIANT: Record<PaymentStatus, ChipVariant> = {
  paid: "success",
  pending: "warning",
  refunded: "info",
  failed: "danger",
};

export const PAYMENT_FILTER_OPTIONS: Array<{ id: "all" | PaymentStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "refunded", label: "Refunded" },
  { id: "failed", label: "Failed" },
];

/**
 * Format an INR (₹) amount. Decimals are dropped when the amount is a whole
 * rupee, otherwise the amount is shown with 2 decimal places. The rupee
 * symbol is always prefixed.
 */
export function formatINR(amount: number): string {
  if (Number.isInteger(amount)) return `₹${amount.toLocaleString("en-IN")}`;
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// __demo: true — placeholder fixtures used until the payments API is wired.
export const DEMO_PAYMENTS: PaymentTransaction[] = [
  {
    id: "txn-2026-0001",
    transactionRef: "TXN-2026-0001",
    date: "2026-08-17",
    time: "10:42",
    patientName: "Aarav Sharma",
    patientId: "P-10234",
    amount: 1280,
    status: "paid",
    method: "upi",
    relatedModule: "opd",
    relatedRef: "OPD-9821",
    receivedBy: "Cashier · Priya M.",
    payer: "Self",
    breakdown: [
      { label: "Consultation · Dr. Mehta", amount: 600 },
      { label: "Lab · CBC + ESR", amount: 480 },
      { label: "Pharmacy", amount: 200 },
    ],
    gatewayRef: "UPI/3821/229911",
    timeline: [
      { title: "Payment captured", subtitle: "UPI · BHIM", when: "10:42", tint: "emerald", icon: "checkmark-circle" },
      { title: "Bill settled", subtitle: "Cashier · Priya M.", when: "10:41", tint: "blue", icon: "card" },
      { title: "Bill generated", subtitle: "Linked to OPD-9821", when: "10:38", tint: "slate", icon: "hourglass" },
    ],
  },
  {
    id: "txn-2026-0002",
    transactionRef: "TXN-2026-0002",
    date: "2026-08-17",
    time: "09:58",
    patientName: "Diya Iyer",
    patientId: "P-09812",
    amount: 4600,
    status: "pending",
    method: "insurance",
    relatedModule: "ipd",
    relatedRef: "IPD-7341",
    receivedBy: "Cashier · Anita R.",
    payer: "Insurance · Star Health",
    breakdown: [
      { label: "Ward charges · 2 days", amount: 2400 },
      { label: "Surgery package", amount: 1800 },
      { label: "Consumables", amount: 400 },
    ],
    timeline: [
      { title: "Awaiting TPA approval", subtitle: "Star Health · Pre-auth pending", when: "09:58", tint: "amber", icon: "hourglass" },
      { title: "Pre-auth submitted", subtitle: "Auto-routed via Celiyo Billing", when: "09:42", tint: "blue", icon: "shield-checkmark" },
      { title: "Discharge requested", subtitle: "Dr. Kapoor", when: "Yesterday", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "txn-2026-0003",
    transactionRef: "TXN-2026-0003",
    date: "2026-08-16",
    time: "18:11",
    patientName: "Rohan Verma",
    patientId: "P-11002",
    amount: 845,
    status: "paid",
    method: "card",
    relatedModule: "lab",
    relatedRef: "LAB-5523",
    receivedBy: "Cashier · Rakesh S.",
    payer: "Self",
    breakdown: [
      { label: "Lipid Profile", amount: 480 },
      { label: "Thyroid (T3, T4, TSH)", amount: 365 },
    ],
    gatewayRef: "VISA-9921",
    timeline: [
      { title: "Payment captured", subtitle: "Visa · ending 4421", when: "18:11", tint: "emerald", icon: "checkmark-circle" },
      { title: "Bill settled", subtitle: "Cashier · Rakesh S.", when: "18:10", tint: "blue", icon: "card" },
    ],
  },
  {
    id: "txn-2026-0004",
    transactionRef: "TXN-2026-0004",
    date: "2026-08-16",
    time: "14:24",
    patientName: "Meera Pillai",
    patientId: "P-07721",
    amount: 32000,
    status: "refunded",
    method: "upi",
    relatedModule: "ipd",
    relatedRef: "IPD-7199",
    receivedBy: "Cashier · Anita R.",
    payer: "Insurance · ICICI Lombard",
    breakdown: [
      { label: "Deposit received", amount: 32000 },
      { label: "Final bill", amount: 28200 },
      { label: "Refund processed", amount: 3800 },
    ],
    gatewayRef: "UPI/7711/990042",
    timeline: [
      { title: "Refund disbursed", subtitle: "UPI · BHIM", when: "14:24", tint: "violet", icon: "refresh-circle" },
      { title: "Refund approved", subtitle: "Admin · S. Khanna", when: "13:55", tint: "blue", icon: "shield-checkmark" },
      { title: "Deposit captured", subtitle: "Original payment", when: "12 Aug, 09:10", tint: "slate", icon: "card" },
    ],
  },
  {
    id: "txn-2026-0005",
    transactionRef: "TXN-2026-0005",
    date: "2026-08-16",
    time: "11:02",
    patientName: "Kabir Reddy",
    patientId: "P-09311",
    amount: 1500,
    status: "failed",
    method: "card",
    relatedModule: "pharmacy",
    relatedRef: "PH-4412",
    receivedBy: "Cashier · Rakesh S.",
    payer: "Self",
    gatewayRef: "MC-1209",
    breakdown: [
      { label: "Antibiotic course (5 days)", amount: 980 },
      { label: "Antacid syrup", amount: 520 },
    ],
    timeline: [
      { title: "Payment failed", subtitle: "Issuer declined · try another method", when: "11:02", tint: "rose", icon: "alert-circle" },
      { title: "Bill generated", subtitle: "Pharmacy · PH-4412", when: "10:58", tint: "slate", icon: "hourglass" },
    ],
  },
  {
    id: "txn-2026-0006",
    transactionRef: "TXN-2026-0006",
    date: "2026-08-15",
    time: "16:38",
    patientName: "Saanvi Joshi",
    patientId: "P-12008",
    amount: 6750,
    status: "paid",
    method: "netbanking",
    relatedModule: "daycare",
    relatedRef: "DC-2310",
    receivedBy: "Cashier · Priya M.",
    payer: "Self",
    breakdown: [
      { label: "Daycare · Chemo session", amount: 5400 },
      { label: "Pre-medication", amount: 1350 },
    ],
    gatewayRef: "HDFC-7711",
    timeline: [
      { title: "Payment captured", subtitle: "HDFC NetBanking", when: "16:38", tint: "emerald", icon: "checkmark-circle" },
      { title: "Bill settled", subtitle: "Cashier · Priya M.", when: "16:36", tint: "blue", icon: "card" },
    ],
  },
  {
    id: "txn-2026-0007",
    transactionRef: "TXN-2026-0007",
    date: "2026-08-15",
    time: "13:14",
    patientName: "Yash Kulkarni",
    patientId: "P-05518",
    amount: 340,
    status: "paid",
    method: "cash",
    relatedModule: "opd",
    relatedRef: "OPD-9788",
    receivedBy: "Cashier · Rakesh S.",
    payer: "Self",
    breakdown: [{ label: "Follow-up consultation", amount: 340 }],
    timeline: [
      { title: "Cash received", subtitle: "Cashier · Rakesh S.", when: "13:14", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "txn-2026-0008",
    transactionRef: "TXN-2026-0008",
    date: "2026-08-15",
    time: "09:21",
    patientName: "Tara Bose",
    patientId: "P-11823",
    amount: 9750,
    status: "pending",
    method: "insurance",
    relatedModule: "ipd",
    relatedRef: "IPD-7352",
    receivedBy: "Cashier · Anita R.",
    payer: "Insurance · New India Assurance",
    breakdown: [
      { label: "Surgical package", amount: 7400 },
      { label: "Implant", amount: 1800 },
      { label: "Ward (1 day)", amount: 550 },
    ],
    timeline: [
      { title: "Pre-auth in review", subtitle: "New India Assurance", when: "09:21", tint: "amber", icon: "hourglass" },
      { title: "Bill generated", subtitle: "Linked to IPD-7352", when: "08:58", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "txn-2026-0009",
    transactionRef: "TXN-2026-0009",
    date: "2026-08-14",
    time: "17:44",
    patientName: "Arjun Nair",
    patientId: "P-10029",
    amount: 2250,
    status: "paid",
    method: "wallet",
    relatedModule: "lab",
    relatedRef: "LAB-5499",
    receivedBy: "Cashier · Priya M.",
    payer: "Self",
    gatewayRef: "PAYTM-WLT-007",
    breakdown: [
      { label: "Full body checkup", amount: 1899 },
      { label: "Urgent processing fee", amount: 351 },
    ],
    timeline: [
      { title: "Wallet captured", subtitle: "Paytm Wallet", when: "17:44", tint: "emerald", icon: "checkmark-circle" },
      { title: "Bill settled", subtitle: "Cashier · Priya M.", when: "17:43", tint: "blue", icon: "card" },
    ],
  },
  {
    id: "txn-2026-0010",
    transactionRef: "TXN-2026-0010",
    date: "2026-08-14",
    time: "12:09",
    patientName: "Anaya Desai",
    patientId: "P-08401",
    amount: 5100,
    status: "refunded",
    method: "card",
    relatedModule: "opd",
    relatedRef: "OPD-9691",
    receivedBy: "Cashier · Anita R.",
    payer: "Self",
    gatewayRef: "MC-8833",
    breakdown: [
      { label: "Procedure package", amount: 4800 },
      { label: "Cancellation fee", amount: 300 },
    ],
    timeline: [
      { title: "Refund credited", subtitle: "Mastercard · ending 5588", when: "12:09", tint: "violet", icon: "refresh-circle" },
      { title: "Refund approved", subtitle: "Admin · S. Khanna", when: "11:42", tint: "blue", icon: "shield-checkmark" },
      { title: "Original capture", subtitle: "Card · Mastercard", when: "13 Aug, 16:00", tint: "slate", icon: "card" },
    ],
  },
  {
    id: "txn-2026-0011",
    transactionRef: "TXN-2026-0011",
    date: "2026-08-14",
    time: "08:55",
    patientName: "Veer Choudhury",
    patientId: "P-13101",
    amount: 480,
    status: "paid",
    method: "upi",
    relatedModule: "opd",
    relatedRef: "OPD-9812",
    receivedBy: "Cashier · Rakesh S.",
    payer: "Self",
    gatewayRef: "UPI/2200/77821",
    breakdown: [{ label: "Tele-consultation", amount: 480 }],
    timeline: [
      { title: "UPI captured", subtitle: "Google Pay", when: "08:55", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "txn-2026-0012",
    transactionRef: "TXN-2026-0012",
    date: "2026-08-13",
    time: "19:12",
    patientName: "Ishaan Kapoor",
    patientId: "P-06712",
    amount: 21000,
    status: "pending",
    method: "insurance",
    relatedModule: "ipd",
    relatedRef: "IPD-7301",
    receivedBy: "Cashier · Anita R.",
    payer: "Insurance · Max Bupa",
    breakdown: [
      { label: "ICU · 2 days", amount: 9000 },
      { label: "Ventilator", amount: 6500 },
      { label: "Investigation panel", amount: 5500 },
    ],
    timeline: [
      { title: "TPA inquiry sent", subtitle: "Max Bupa · Auth #8821", when: "19:12", tint: "amber", icon: "hourglass" },
      { title: "Bill generated", subtitle: "Linked to IPD-7301", when: "18:45", tint: "slate", icon: "time" },
    ],
  },
  {
    id: "txn-2026-0013",
    transactionRef: "TXN-2026-0013",
    date: "2026-08-13",
    time: "15:20",
    patientName: "Priya Menon",
    patientId: "P-11290",
    amount: 980,
    status: "paid",
    method: "upi",
    relatedModule: "pharmacy",
    relatedRef: "PH-4398",
    receivedBy: "Cashier · Priya M.",
    payer: "Self",
    gatewayRef: "UPI/1100/44521",
    breakdown: [
      { label: "Insulin pen refill", amount: 780 },
      { label: "Glucose strips", amount: 200 },
    ],
    timeline: [
      { title: "UPI captured", subtitle: "PhonePe", when: "15:20", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
  {
    id: "txn-2026-0014",
    transactionRef: "TXN-2026-0014",
    date: "2026-08-13",
    time: "10:05",
    patientName: "Arnav Singh",
    patientId: "P-04411",
    amount: 2200,
    status: "failed",
    method: "card",
    relatedModule: "opd",
    relatedRef: "OPD-9802",
    receivedBy: "Cashier · Rakesh S.",
    payer: "Self",
    gatewayRef: "VISA-3344",
    breakdown: [
      { label: "Dermatology package", amount: 2200 },
    ],
    timeline: [
      { title: "Card declined", subtitle: "Issuer · HDFC Bank", when: "10:05", tint: "rose", icon: "alert-circle" },
      { title: "Bill generated", subtitle: "OPD-9802", when: "10:00", tint: "slate", icon: "hourglass" },
    ],
  },
  {
    id: "txn-2026-0015",
    transactionRef: "TXN-2026-0015",
    date: "2026-08-12",
    time: "16:48",
    patientName: "Myra Bhandari",
    patientId: "P-12934",
    amount: 16500,
    status: "paid",
    method: "netbanking",
    relatedModule: "ipd",
    relatedRef: "IPD-7288",
    receivedBy: "Cashier · Anita R.",
    payer: "Self",
    gatewayRef: "ICICI-5577",
    breakdown: [
      { label: "Maternity package", amount: 14000 },
      { label: "Neonatal screening", amount: 2500 },
    ],
    timeline: [
      { title: "NetBanking captured", subtitle: "ICICI Bank", when: "16:48", tint: "emerald", icon: "checkmark-circle" },
      { title: "Bill settled", subtitle: "Cashier · Anita R.", when: "16:46", tint: "blue", icon: "card" },
    ],
  },
  {
    id: "txn-2026-0016",
    transactionRef: "TXN-2026-0016",
    date: "2026-08-12",
    time: "11:32",
    patientName: "Atharv Tiwari",
    patientId: "P-07002",
    amount: 725,
    status: "paid",
    method: "wallet",
    relatedModule: "lab",
    relatedRef: "LAB-5477",
    receivedBy: "Cashier · Priya M.",
    payer: "Self",
    gatewayRef: "AMAZONPAY-22",
    breakdown: [
      { label: "Dengue NS1 antigen", amount: 725 },
    ],
    timeline: [
      { title: "Wallet captured", subtitle: "Amazon Pay", when: "11:32", tint: "emerald", icon: "checkmark-circle" },
    ],
  },
];

/**
 * Quick aggregate numbers shown in the QuickStats row of the detail screen.
 * Real values would come from the API; for demo we compute deterministic
 * totals so the row looks plausible.
 */
export const DEMO_PAYMENT_QUICK_STATS = {
  totalCollected: 112_495,
  pendingAmount: 33_350,
  refundedAmount: 35_800,
  todayCount: 5,
};
