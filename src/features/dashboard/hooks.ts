import { useQuery } from "@tanstack/react-query";
import * as api from "../../lib/api/dashboard";
import { getActiveAdmissions } from "../../lib/api/ipd";
import { useAuth } from "../../store/AuthContext";
import type { DateRangeParams } from "../../types/dashboard";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const dashboardKeys = {
  overview: (params?: DateRangeParams) => ["dashboard", "overview", params ?? {}] as const,
  operations: () => ["dashboard", "operations"] as const,
  financial: (params?: DateRangeParams) => ["dashboard", "financial", params ?? {}] as const,
  clinical: (params?: DateRangeParams) => ["dashboard", "clinical", params ?? {}] as const,
  inventory: () => ["dashboard", "inventory"] as const,
  recentEncounters: (params?: api.RecentEncountersParams) =>
    ["dashboard", "recent-encounters", params ?? {}] as const,
  billPaymentsStats: (params?: api.BillPaymentsStatsParams) =>
    ["dashboard", "bill-payments-stats", params ?? {}] as const,
  recentPayments: (params?: DateRangeParams) => ["dashboard", "recent-payments", params ?? {}] as const,
  opdDoctorStats: (params?: DateRangeParams & { doctor?: "me" }) =>
    ["dashboard", "opd-doctor-stats", params ?? {}] as const,
  ipdDoctorStats: (params?: DateRangeParams & { doctor?: "me" }) =>
    ["dashboard", "ipd-doctor-stats", params ?? {}] as const,
  patientStatistics: () => ["dashboard", "patient-statistics"] as const,
  doctorStatistics: () => ["dashboard", "doctor-statistics"] as const,
  appointmentsToday: () => ["dashboard", "appointments-today"] as const,
  wardOccupancy: () => ["dashboard", "ward-occupancy"] as const,
  activeAdmissions: () => ["dashboard", "active-admissions"] as const,
  unpaidOpdBills: () => ["dashboard", "unpaid-opd-bills"] as const,
  unpaidIpdBills: () => ["dashboard", "unpaid-ipd-bills"] as const,
  openAlerts: (tags?: string) => ["dashboard", "open-alerts", tags ?? ""] as const,
  alertsSummary: (tags?: string) => ["dashboard", "alerts-summary", tags ?? ""] as const,
  diagnosticPending: () => ["dashboard", "diagnostic-pending"] as const,
};

// ─── Domain queries (mirror celiyohms's per-domain staleTime/poll cadence) ─

export function useDashboardOverview(params?: DateRangeParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.overview(params),
    queryFn: () => api.getDashboardOverview(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useDashboardOperations() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.operations(),
    queryFn: () => api.getDashboardOperations(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useDashboardFinancial(params?: DateRangeParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.financial(params),
    queryFn: () => api.getDashboardFinancial(params),
    enabled,
    staleTime: 120_000,
  });
}

export function useDashboardClinical(params?: DateRangeParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.clinical(params),
    queryFn: () => api.getDashboardClinical(params),
    enabled,
    staleTime: 120_000,
  });
}

export function useDashboardInventory() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.inventory(),
    queryFn: () => api.getDashboardInventory(),
    enabled,
    staleTime: 60_000,
  });
}

export function useRecentEncounters(params?: api.RecentEncountersParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.recentEncounters(params),
    queryFn: () => api.getRecentEncounters(params),
    enabled,
    staleTime: 15_000,
  });
}

// ─── Financial supplements ────────────────────────────────────────────────

export function useBillPaymentsStats(params?: api.BillPaymentsStatsParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.billPaymentsStats(params),
    queryFn: () => api.getBillPaymentsStats(params),
    enabled,
    staleTime: params?.date_from ? 120_000 : 60_000,
  });
}

export function useRecentBillPayments(params?: DateRangeParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.recentPayments(params),
    queryFn: () => api.getRecentBillPayments(params),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useUnpaidOpdBills() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.unpaidOpdBills(),
    queryFn: () => api.getUnpaidOpdBills(),
    enabled,
    staleTime: 60_000,
  });
}

export function useUnpaidIpdBills() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.unpaidIpdBills(),
    queryFn: () => api.getUnpaidIpdBills(),
    enabled,
    staleTime: 60_000,
  });
}

// ─── Clinical / doctor stats ────────────────────────────────────────────

export function useOpdDoctorStats(params?: DateRangeParams & { doctor?: "me" }) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.opdDoctorStats(params),
    queryFn: () => api.getOpdDoctorStats(params),
    enabled,
    staleTime: 60_000,
  });
}

export function useIpdDoctorStats(params?: DateRangeParams & { doctor?: "me" }) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.ipdDoctorStats(params),
    queryFn: () => api.getIpdDoctorStats(params),
    enabled,
    staleTime: 60_000,
  });
}

// ─── Roster / patients ───────────────────────────────────────────────────

export function usePatientStatistics() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.patientStatistics(),
    queryFn: () => api.getPatientStatistics(),
    enabled,
    staleTime: 300_000,
  });
}

export function useDoctorStatistics() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.doctorStatistics(),
    queryFn: () => api.getDoctorStatistics(),
    enabled,
    staleTime: 300_000,
  });
}

export function useAppointmentsToday() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.appointmentsToday(),
    queryFn: () => api.getAppointmentsToday(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ─── IPD supplements ─────────────────────────────────────────────────────

export function useWardOccupancy() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.wardOccupancy(),
    queryFn: () => api.getWardOccupancy(),
    enabled,
    staleTime: 60_000,
  });
}

export function useActiveAdmissions() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.activeAdmissions(),
    queryFn: () => getActiveAdmissions(),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ─── Pharmacy / inventory alerts ─────────────────────────────────────────

export function useOpenAlerts(tags?: string) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.openAlerts(tags),
    queryFn: () => api.getOpenAlerts(tags ? { tags } : undefined),
    enabled,
    staleTime: 60_000,
  });
}

export function useAlertsSummary(tags?: string) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: dashboardKeys.alertsSummary(tags),
    queryFn: () => api.getAlertsSummary(tags ? { tags } : undefined),
    enabled,
    staleTime: 60_000,
  });
}

export function useFollowUpVisits() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["dashboard", "follow-up-visits"],
    queryFn: () => api.getFollowUpVisits(),
    enabled,
    staleTime: 60_000,
  });
}

// ─── Diagnostics (lab) ───────────────────────────────────────────────────

/** Sums `ordered` + `sample_collected` counts — no dedicated pending-lab endpoint exists. */
export function useDiagnosticStatusCount(status: api.DiagnosticOrderStatus) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ["dashboard", "diagnostic-count", status],
    queryFn: () => api.getDiagnosticOrderCount(status),
    enabled,
    staleTime: 30_000,
  });
}
