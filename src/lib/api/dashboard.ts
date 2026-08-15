/**
 * dghms dashboard API (/api/dashboard/*, plus the supplementary stats
 * endpoints the dashboard screens pull directly). Endpoint shapes confirmed
 * against apps/dashboard/views.py + each module's own `statistics`/`stats`
 * action.
 *
 * IMPORTANT: these endpoints only require tenant auth — they do NOT filter
 * sections by the caller's hms.<module>.view permission. Callers (hooks/
 * screens) must gate rendering with useAuth().can(...) themselves.
 */
import { hmsGet, type Paginated } from "./hmsClient";
import type {
  AlertsSummary,
  AppointmentToday,
  BillPaymentsStats,
  DashboardClinical,
  DashboardFinancial,
  DashboardInventory,
  DashboardOperations,
  DashboardOverview,
  DateRangeParams,
  DoctorStatistics,
  IpdDoctorStatEntry,
  OpdDoctorStatEntry,
  PatientStatistics,
  RecentEncountersPage,
} from "../../types/dashboard";
import type { OPDBill, VisitListItem } from "../../types/opd";
import type { IPDBilling } from "../../types/ipd";

interface Envelope<T> {
  success: boolean;
  data: T;
}

export function getDashboardOverview(params?: DateRangeParams) {
  return hmsGet<Envelope<DashboardOverview>>("/dashboard/v2/overview", { params }).then((r) => r.data);
}

export function getDashboardOperations(params?: DateRangeParams) {
  return hmsGet<Envelope<DashboardOperations>>("/dashboard/v2/operations", { params }).then((r) => r.data);
}

export function getDashboardFinancial(params?: DateRangeParams) {
  return hmsGet<Envelope<DashboardFinancial>>("/dashboard/v2/financial", { params }).then((r) => r.data);
}

export function getDashboardClinical(params?: DateRangeParams) {
  return hmsGet<Envelope<DashboardClinical>>("/dashboard/v2/clinical", { params }).then((r) => r.data);
}

export function getDashboardInventory(params?: DateRangeParams & { tags?: string }) {
  return hmsGet<Envelope<DashboardInventory>>("/dashboard/v2/inventory", { params }).then((r) => r.data);
}

export interface RecentEncountersParams extends DateRangeParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export function getRecentEncounters(params?: RecentEncountersParams) {
  return hmsGet<Envelope<RecentEncountersPage>>("/dashboard/recent-encounters", { params }).then(
    (r) => r.data
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────

export interface BillPaymentsStatsParams extends DateRangeParams {
  bill_type?: string;
}

export function getBillPaymentsStats(params?: BillPaymentsStatsParams) {
  return hmsGet<Envelope<BillPaymentsStats>>("/payments/bill-payments/stats", { params }).then(
    (r) => r.data
  );
}

export interface RecentBillPayment {
  id: number;
  opd_bill: number | null;
  ipd_bill: number | null;
  amount: string;
  payment_mode: string;
  payment_date: string;
  received_by_id: string | null;
  notes: string | null;
  created_at: string;
}

export function getRecentBillPayments(params?: { page_size?: number } & DateRangeParams) {
  return hmsGet<Paginated<RecentBillPayment>>("/payments/bill-payments", {
    params: { ordering: "-created_at", page_size: 10, ...params },
  }).then((r) => r.results);
}

// ─── Doctor-wise stats ──────────────────────────────────────────────────

export function getOpdDoctorStats(params?: DateRangeParams & { doctor?: "me" }) {
  return hmsGet<Envelope<OpdDoctorStatEntry[]>>("/opd/visits/doctor_stats", { params }).then(
    (r) => r.data
  );
}

export function getIpdDoctorStats(params?: DateRangeParams & { doctor?: "me" }) {
  return hmsGet<Envelope<IpdDoctorStatEntry[]>>("/ipd/admissions/doctor_stats", { params }).then(
    (r) => r.data
  );
}

// ─── Patients / Doctors roster ─────────────────────────────────────────────

export function getPatientStatistics() {
  return hmsGet<Envelope<PatientStatistics>>("/patients/profiles/statistics").then((r) => r.data);
}

export function getDoctorStatistics() {
  return hmsGet<Envelope<DoctorStatistics>>("/doctors/statistics").then((r) => r.data);
}

// ─── Appointments ───────────────────────────────────────────────────────

export function getAppointmentsToday() {
  return hmsGet<{ success: boolean; count: number; data: AppointmentToday[] }>(
    "/appointments/today"
  ).then((r) => ({ count: r.count, data: r.data }));
}

// ─── Ward occupancy (per-ward breakdown) ─────────────────────────────────

export interface WardOccupancy {
  ward: string;
  ward_id: number;
  ward_type: string;
  total_beds: number;
  occupied: number;
  rate: number;
}

export function getWardOccupancy() {
  return hmsGet<Envelope<WardOccupancy[]>>("/ipd/wards/occupancy").then((r) => r.data);
}

// ─── Unpaid bill worklists (Cashier) ────────────────────────────────────

export function getUnpaidOpdBills(params?: { page_size?: number }) {
  return hmsGet<Paginated<OPDBill>>("/opd/opd-bills", {
    params: { payment_status: "unpaid", page_size: 10, ...params },
  }).then((r) => r.results);
}

export function getUnpaidIpdBills(params?: { page_size?: number }) {
  return hmsGet<Paginated<IPDBilling>>("/ipd/billings", {
    params: { payment_status: "unpaid", page_size: 10, ...params },
  }).then((r) => r.results);
}

// ─── Follow-ups due (Receptionist/Doctor) — VisitListParams doesn't expose
// follow_up filters, so this bypasses the typed opd.ts client. ────────────

export function getFollowUpVisits(params?: { page_size?: number }) {
  return hmsGet<Paginated<VisitListItem>>("/opd/visits", {
    params: {
      follow_up_required: true,
      status: "completed",
      ordering: "follow_up_date",
      page_size: 10,
      ...params,
    },
  }).then((r) => r.results);
}

// ─── Inventory alerts (Pharmacist) ─────────────────────────────────────

export interface InventoryAlert {
  id: number;
  alert_type: string;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
  item_name?: string;
}

export function getOpenAlerts(params?: { tags?: string; page_size?: number }) {
  return hmsGet<Paginated<InventoryAlert>>("/inventory/alerts", {
    params: { is_acknowledged: false, page_size: 10, ...params },
  }).then((r) => r.results);
}

export function getAlertsSummary(params?: { tags?: string }) {
  return hmsGet<Envelope<AlertsSummary>>("/inventory/alerts/summary", { params }).then((r) => r.data);
}

// ─── Diagnostics (Lab technician — no dedicated stats endpoint exists) ────

export type DiagnosticOrderStatus = "ordered" | "sample_collected" | "completed" | "cancelled";

export function getDiagnosticOrderCount(status: DiagnosticOrderStatus) {
  return hmsGet<Paginated<unknown>>("/diagnostics/orders", { params: { status, page_size: 1 } }).then(
    (r) => r.count
  );
}
