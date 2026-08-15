/**
 * Types for dghms's dashboard domain (/api/dashboard/*) plus the handful of
 * supplementary stats endpoints the dashboard screens pull directly
 * (bill-payments/stats, doctor_stats, patient/doctor roster statistics).
 *
 * OPDStats / IPDStats already live in types/opd.ts / types/ipd.ts — reused,
 * not redefined here.
 */
import type { OPDStats } from "./opd";
import type { IPDStats } from "./ipd";

export interface DateRangeParams {
  date_from?: string;
  date_to?: string;
}

// ─── OPD / IPD bill + payment stats ────────────────────────────────────────

export interface OPDBillStats {
  total_bills: number;
  total_revenue: string;
  paid_revenue: string;
  pending_amount: string;
  total_discount: string;
  bills_paid: number;
  bills_partial: number;
  bills_unpaid: number;
  by_opd_type: Array<{ opd_type: string; count: number; revenue: string }>;
  by_payment_mode: Array<{ payment_mode: string; count: number; amount: string }>;
  average_bill_amount: string;
}

export interface IPDBillingStats {
  total_bills: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  cancelled_amount: number;
}

export interface TransactionStats {
  overall_stats: {
    total_transactions: number;
    total_amount: number;
    total_payments: number;
    total_expenses: number;
    total_refunds: number;
  };
  payment_method_breakdown: Array<{ payment_method: string; count: number; total_amount: number }>;
  transaction_type_breakdown: Array<{ transaction_type: string; count: number; total_amount: number }>;
}

export interface BillPaymentsStats {
  total_collected: number;
  transaction_count: number;
  collected_today: number;
  count_today: number;
  collected_this_week: number;
  collected_this_month: number;
  by_mode: Array<{ payment_mode: string; count: number; total: number }>;
  by_type: Array<{ bill_type: string; count: number; total: number }>;
  daily_trend: Array<{ date: string; total: number; count: number }>;
}

// ─── Doctor stats ───────────────────────────────────────────────────────

export interface OpdDoctorStatEntry {
  doctor: number;
  visits_count: number;
  waiting: number;
  in_consultation: number;
  completed: number;
  revenue: string;
  revenue_today: string;
  visits_today: number;
  avg_consultation_mins: number | null;
  doctor_name: string;
  ipd_admissions: number;
  doctor_specialty: string | null;
}

export interface IpdDoctorStatEntry {
  doctor: string;
  admissions_count: number;
  active: number;
  discharged: number;
  transferred: number;
  mediclaim_count: number;
  claim_pending: number;
  claim_approved: number;
  claim_rejected: number;
  claim_settled: number;
  avg_length_of_stay_days: number | null;
  doctor_name: string;
  doctor_specialty: string | null;
}

// ─── Pharmacy / Inventory ─────────────────────────────────────────────────

export interface PharmacyProductStats {
  total_products: number;
  active_products: number;
  inactive_products: number;
  in_stock_products: number;
  out_of_stock_products: number;
  low_stock_products: number;
  near_expiry_products: number;
  expired_products: number;
  categories: number;
}

export interface PharmacyOrderStats {
  total_orders: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_spent: number;
}

export interface InventoryDashboardStats {
  has_inventory_items: boolean;
  total_items: number;
  active_items: number;
  low_stock_count: number;
  out_of_stock_count: number;
  overstock_count: number;
  expiring_soon_count: number;
  expired_count: number;
  total_categories: number;
  active_alerts: number;
  unacknowledged_alerts: number;
  total_stock_value: string;
  recent_transactions: unknown[];
}

export interface AlertsSummary {
  total: number;
  unacknowledged: number;
  by_type: Record<string, number>;
}

// ─── Patients / Doctors roster ─────────────────────────────────────────────

export interface PatientStatistics {
  total_patients: number;
  active_patients: number;
  inactive_patients: number;
  deceased_patients: number;
  patients_with_insurance: number;
  average_age: number;
  total_visits: number;
  gender_distribution: Record<string, number>;
  blood_group_distribution: Record<string, number>;
  registrations_today: number;
  daily_trend?: Array<{ date: string; registrations: number }>;
}

export interface DoctorStatistics {
  total_doctors: number;
  active_doctors: number;
  on_leave_doctors: number;
  inactive_doctors: number;
  average_rating: number;
  average_experience: number;
  average_consultation_fee: number;
  generated_at: string;
}

// ─── Appointments ───────────────────────────────────────────────────────

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export interface AppointmentToday {
  id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  scheduled_time: string;
  status: AppointmentStatus;
  status_label: string;
  reason: string | null;
}

// ─── Dashboard v2 domain payloads ──────────────────────────────────────────

export interface DashboardOverview {
  generated_at: string;
  opd_statistics: OPDStats | null;
  ipd_statistics: IPDStats | null;
}

export interface DashboardOperations {
  generated_at: string;
  appointments_today: AppointmentToday[] | null;
}

export interface DashboardFinancial {
  generated_at: string;
  payment_stats: TransactionStats | null;
  opd_bill_stats: OPDBillStats | null;
  ipd_billing_stats: IPDBillingStats | null;
}

export interface DashboardClinical {
  generated_at: string;
  opd_doctor_stats: OpdDoctorStatEntry[] | null;
  ipd_doctor_stats: IpdDoctorStatEntry[] | null;
}

export interface DashboardInventory {
  generated_at: string;
  pharmacy_product_stats: PharmacyProductStats | null;
  pharmacy_order_stats: PharmacyOrderStats | null;
  inventory_dashboard: InventoryDashboardStats | null;
  inventory_alerts: AlertsSummary | null;
}

// ─── Recent encounters (bespoke envelope) ──────────────────────────────────

export interface RecentEncounter {
  encounter_type: "opd" | "ipd";
  encounter_id: number;
  patient_id: number;
  patient_name: string;
  number: string;
  doctor_name: string | null;
  date: string;
  status: string;
  pending_pharmacy_count: number;
  pending_lab_count: number;
}

export interface RecentEncountersPage {
  results: RecentEncounter[];
  count: number;
  page: number;
  page_size: number;
}
