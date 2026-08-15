import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/opd";
import * as vitalsApi from "../../lib/api/opdVitals";
import * as attachmentsApi from "../../lib/api/opdAttachments";
import * as billingApi from "../../lib/api/opdBilling";
import { listOpdBillPayments } from "../../lib/api/payments";
import { useAuth } from "../../store/AuthContext";
import type { VisitCreatePayload, VisitFindingCreatePayload, AttachmentFileType, OpdBillItemCreatePayload, OpdType, ChargeType } from "../../types/opd";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const opdKeys = {
  list: (params?: api.VisitListParams) => ["opd", "visits", "list", params ?? {}] as const,
  today: () => ["opd", "visits", "today"] as const,
  queue: () => ["opd", "visits", "queue"] as const,
  detail: (id: number) => ["opd", "visits", "detail", id] as const,
  statistics: (params?: { date_from?: string; date_to?: string }) =>
    ["opd", "statistics", params ?? {}] as const,
  findings: (visitId: number) => ["opd", "visits", visitId, "findings"] as const,
  attachments: (visitId: number) => ["opd", "visits", visitId, "attachments"] as const,
  bills: (visitId: number) => ["opd", "visits", visitId, "bills"] as const,
  billPayments: (billId: number) => ["opd", "bills", billId, "payments"] as const,
};

export function useVisits(params?: api.VisitListParams) {
  const enabled = useSignedIn();
  return useQuery({ queryKey: opdKeys.list(params), queryFn: () => api.listVisits(params), enabled });
}

export function useTodayVisits() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: opdKeys.today(), queryFn: api.getTodayVisits, enabled, staleTime: 15_000 });
}

export function useQueue() {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: opdKeys.queue(),
    queryFn: () => api.getQueue(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

export function useVisit(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({ queryKey: opdKeys.detail(id ?? 0), queryFn: () => api.getVisit(id as number), enabled });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VisitCreatePayload) => api.createVisit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["opd", "visits"] });
    },
  });
}

export function useDeleteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteVisit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opd", "visits"] }),
  });
}

export function useStartVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.startVisit(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: opdKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["opd", "visits"] });
    },
  });
}

export function useCompleteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload?: Parameters<typeof api.completeVisit>[1] }) =>
      api.completeVisit(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: opdKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["opd", "visits"] });
    },
  });
}

export function useOpdStatistics(params?: { date_from?: string; date_to?: string }) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: opdKeys.statistics(params),
    queryFn: () => api.getVisitStatistics(params),
    enabled,
    staleTime: 30_000,
  });
}

// ─── Vitals ──────────────────────────────────────────────────────────────

export function useVisitFindings(visitId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(visitId);
  return useQuery({
    queryKey: opdKeys.findings(visitId ?? 0),
    queryFn: () => vitalsApi.listVisitFindings(visitId as number),
    enabled,
  });
}

export function useCreateVisitFinding(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VisitFindingCreatePayload) => vitalsApi.createVisitFinding(visitId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.findings(visitId) }),
  });
}

// ─── Attachments ────────────────────────────────────────────────────────

export function useAttachments(visitId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(visitId);
  return useQuery({
    queryKey: opdKeys.attachments(visitId ?? 0),
    queryFn: () => attachmentsApi.listAttachments(visitId as number),
    enabled,
  });
}

export function useUploadAttachment(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      fileType,
    }: {
      file: { uri: string; name: string; mimeType: string };
      fileType?: AttachmentFileType;
    }) => attachmentsApi.uploadAttachment(visitId, file, fileType),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.attachments(visitId) }),
  });
}

export function useDeleteAttachment(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attachmentsApi.deleteAttachment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.attachments(visitId) }),
  });
}

// ─── Billing ────────────────────────────────────────────────────────────

export function useOpdBills(visitId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(visitId);
  return useQuery({
    queryKey: opdKeys.bills(visitId ?? 0),
    queryFn: () => billingApi.listOpdBills(visitId as number),
    enabled,
  });
}

export function useCreateOpdBill(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: { doctor?: number; opd_type?: OpdType; charge_type?: ChargeType }) =>
      billingApi.createOpdBill(visitId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.bills(visitId) }),
  });
}

export function useUpdateOpdBill(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { discount_percent?: number } }) =>
      billingApi.updateOpdBill(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.bills(visitId) }),
  });
}

export function useRecordOpdPayment(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { amount: number; payment_mode: string; notes?: string };
    }) => billingApi.recordOpdPayment(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: opdKeys.bills(visitId) });
      qc.invalidateQueries({ queryKey: opdKeys.billPayments(id) });
    },
  });
}

export function useCreateOpdBillItem(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpdBillItemCreatePayload) => billingApi.createOpdBillItem(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.bills(visitId) }),
  });
}

export function useUpdateOpdBillItem(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<OpdBillItemCreatePayload> }) =>
      billingApi.updateOpdBillItem(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.bills(visitId) }),
  });
}

export function useDeleteOpdBillItem(visitId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => billingApi.deleteOpdBillItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: opdKeys.bills(visitId) }),
  });
}

export function useOpdBillPayments(billId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(billId);
  return useQuery({
    queryKey: opdKeys.billPayments(billId ?? 0),
    queryFn: () => listOpdBillPayments(billId as number),
    enabled,
  });
}
