/**
 * Lab / Diagnostics hooks — TanStack Query wrappers around
 * `src/lib/api/diagnosticOrders.ts` (order/requisition/report workflow) and
 * `src/lib/api/diagnostics.ts` (investigation master-catalogue search, used
 * by the New Lab Order test picker).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/diagnosticOrders";
import { searchInvestigations } from "../../lib/api/diagnostics";
import { useAuth } from "../../store/AuthContext";
import type {
  DiagnosticOrderStatus,
  LabReportCreatePayload,
  RequisitionCreatePayload,
} from "../../types/diagnostics";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const diagnosticsKeys = {
  dashboard: (params?: api.OrderListParams) => ["diagnostics", "lab-dashboard", params ?? {}] as const,
  order: (id: number) => ["diagnostics", "orders", id] as const,
  requisition: (id: number) => ["diagnostics", "requisitions", id] as const,
  ranges: (investigationId: number) => ["diagnostics", "ranges", investigationId] as const,
  investigationSearch: (search: string) => ["diagnostics", "investigation-search", search] as const,
};

// ─── Queue / list ───────────────────────────────────────────────────────────

export function useLabDashboard(params?: api.OrderListParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: diagnosticsKeys.dashboard(params),
    queryFn: () => api.listLabDashboard(params),
    enabled,
  });
}

export function useOrder(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: diagnosticsKeys.order(id ?? 0),
    queryFn: () => api.getOrder(id as number),
    enabled,
  });
}

export function useRequisition(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: diagnosticsKeys.requisition(id ?? 0),
    queryFn: () => api.getRequisition(id as number),
    enabled,
  });
}

// ─── Status progression ────────────────────────────────────────────────────

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: DiagnosticOrderStatus }) =>
      api.updateOrderStatus(id, status),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: diagnosticsKeys.order(id) });
      qc.invalidateQueries({ queryKey: ["diagnostics", "lab-dashboard"] });
    },
  });
}

export function useSetOrderSampleId() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sampleId }: { id: number; sampleId: string }) =>
      api.setOrderSampleId(id, sampleId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: diagnosticsKeys.order(id) });
      qc.invalidateQueries({ queryKey: ["diagnostics", "lab-dashboard"] });
    },
  });
}

/** Collect-sample step — sets `sample_id` and advances `status` to `sample_collected` in one PATCH. */
export function useCollectSample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sampleId }: { id: number; sampleId: string }) => api.collectSample(id, sampleId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: diagnosticsKeys.order(id) });
      qc.invalidateQueries({ queryKey: ["diagnostics", "lab-dashboard"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.cancelOrder(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: diagnosticsKeys.order(id) });
      qc.invalidateQueries({ queryKey: ["diagnostics", "lab-dashboard"] });
    },
  });
}

// ─── Requisitions ───────────────────────────────────────────────────────────

export function useCreateRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RequisitionCreatePayload) => api.createRequisition(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diagnostics"] }),
  });
}

export function useCancelRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requisition: Parameters<typeof api.cancelRequisitionCascade>[0]) =>
      api.cancelRequisitionCascade(requisition),
    onSuccess: (_data, requisition) => {
      qc.invalidateQueries({ queryKey: diagnosticsKeys.requisition(requisition.id) });
      qc.invalidateQueries({ queryKey: ["diagnostics", "lab-dashboard"] });
    },
  });
}

// ─── Reference ranges ───────────────────────────────────────────────────────

export function useInvestigationRanges(investigationId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(investigationId);
  return useQuery({
    queryKey: diagnosticsKeys.ranges(investigationId ?? 0),
    queryFn: async () => {
      const res = await api.listInvestigationRanges(investigationId as number);
      return Array.isArray(res) ? res : res.results;
    },
    enabled,
  });
}

// ─── Reports ────────────────────────────────────────────────────────────────

export function useLabReportForOrder(orderId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(orderId);
  return useQuery({
    queryKey: ["diagnostics", "reports", "for-order", orderId ?? 0],
    queryFn: async () => {
      const res = await api.listLabReportsForOrder(orderId as number);
      return res.results[0] ?? null;
    },
    enabled,
  });
}

export function useCreateLabReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LabReportCreatePayload) => api.createLabReport(payload),
    onSuccess: (_data, payload) => {
      qc.invalidateQueries({ queryKey: diagnosticsKeys.order(payload.diagnostic_order) });
      qc.invalidateQueries({ queryKey: ["diagnostics", "reports", "for-order", payload.diagnostic_order] });
      qc.invalidateQueries({ queryKey: ["diagnostics", "lab-dashboard"] });
    },
  });
}

export function useVerifyLabReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, verifiedByUserId }: { id: number; verifiedByUserId: string }) =>
      api.verifyLabReport(id, verifiedByUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["diagnostics"] }),
  });
}

// ─── Investigation (test) search — New Lab Order picker ───────────────────

export function useInvestigationSearch(search: string) {
  const enabled = useSignedIn() && search.trim().length >= 2;
  return useQuery({
    queryKey: diagnosticsKeys.investigationSearch(search.trim()),
    queryFn: () => searchInvestigations(search.trim()),
    enabled,
  });
}
