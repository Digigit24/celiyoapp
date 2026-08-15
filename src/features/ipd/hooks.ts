import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/ipd";
import { listBillPayments } from "../../lib/api/payments";
import { listDocumentTemplates } from "../../lib/api/documents";
import { useAuth } from "../../store/AuthContext";
import type {
  AdmissionCreatePayload,
  BillItemCreatePayload,
  DischargePayload,
  DocumentType,
  RegistrationPatchPayload,
} from "../../types/ipd";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const ipdKeys = {
  list: (params?: api.AdmissionListParams) => ["ipd", "admissions", "list", params ?? {}] as const,
  detail: (id: number) => ["ipd", "admissions", "detail", id] as const,
  registration: (id: number) => ["ipd", "admissions", id, "registration"] as const,
  bedTransfers: (id: number) => ["ipd", "admissions", id, "bed-transfers"] as const,
  dischargePacket: (id: number) => ["ipd", "admissions", id, "discharge-packet"] as const,
  bills: (id: number) => ["ipd", "admissions", id, "bills"] as const,
  billPayments: (billId: number) => ["ipd", "bills", billId, "payments"] as const,
  billTemplates: (search?: string) => ["ipd", "bill-templates", search ?? ""] as const,
  documentTemplates: (docType: DocumentType) => ["ipd", "document-templates", docType] as const,
  statistics: (params?: { date_from?: string; date_to?: string }) =>
    ["ipd", "statistics", params ?? {}] as const,
};

export function useAdmissions(params?: api.AdmissionListParams) {
  const enabled = useSignedIn();
  return useQuery({ queryKey: ipdKeys.list(params), queryFn: () => api.listAdmissions(params), enabled });
}

export function useAdmission(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({ queryKey: ipdKeys.detail(id ?? 0), queryFn: () => api.getAdmission(id as number), enabled });
}

export function useCreateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdmissionCreatePayload) => api.createAdmission(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ipd", "admissions"] }),
  });
}

export function useUpdateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<AdmissionCreatePayload> }) =>
      api.updateAdmission(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ipdKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["ipd", "admissions", "list"] });
    },
  });
}

export function useDischargeAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DischargePayload }) => api.dischargeAdmission(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ipdKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["ipd", "admissions"] });
    },
  });
}

export function useIpdStatistics(params?: { date_from?: string; date_to?: string }) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ipdKeys.statistics(params),
    queryFn: () => api.getAdmissionStatistics(params),
    enabled,
    staleTime: 30_000,
  });
}

// ─── Registration ───────────────────────────────────────────────────────

export function useAdmissionRegistration(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: ipdKeys.registration(id ?? 0),
    queryFn: () => api.getRegistration(id as number),
    enabled,
  });
}

export function useUpdateRegistration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RegistrationPatchPayload }) =>
      api.updateRegistration(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ipdKeys.registration(id) });
      qc.invalidateQueries({ queryKey: ipdKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["ipd", "admissions", "list"] });
    },
  });
}

// ─── Bed transfers ──────────────────────────────────────────────────────

export function useBedTransfers(admissionId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(admissionId);
  return useQuery({
    queryKey: ipdKeys.bedTransfers(admissionId ?? 0),
    queryFn: () => api.listBedTransfers(admissionId as number),
    enabled,
  });
}

export function useCreateBedTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { admission: number; from_bed: string; to_bed: string; reason?: string }) =>
      api.createBedTransfer(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ipdKeys.bedTransfers(variables.admission) });
      qc.invalidateQueries({ queryKey: ipdKeys.registration(variables.admission) });
      qc.invalidateQueries({ queryKey: ipdKeys.detail(variables.admission) });
      qc.invalidateQueries({ queryKey: ["masters", "beds"] });
    },
  });
}

// ─── Discharge packet ───────────────────────────────────────────────────

export function useDischargePacket(admissionId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(admissionId);
  return useQuery({
    queryKey: ipdKeys.dischargePacket(admissionId ?? 0),
    queryFn: () => api.getDischargePacket(admissionId as number),
    enabled,
  });
}

export function useGenerateDischargePacket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (admissionId: number) => api.generateDischargePacket(admissionId),
    onSuccess: (_data, admissionId) =>
      qc.invalidateQueries({ queryKey: ipdKeys.dischargePacket(admissionId) }),
  });
}

export function useUpdateDischargePacket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      admissionId,
      payload,
    }: {
      admissionId: number;
      payload: { narrative?: string; approved?: boolean };
    }) => api.updateDischargePacket(admissionId, payload),
    onSuccess: (_data, { admissionId }) =>
      qc.invalidateQueries({ queryKey: ipdKeys.dischargePacket(admissionId) }),
  });
}

// ─── Billing ────────────────────────────────────────────────────────────

export function useBills(admissionId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(admissionId);
  return useQuery({
    queryKey: ipdKeys.bills(admissionId ?? 0),
    queryFn: () => api.listBills(admissionId as number),
    enabled,
  });
}

export function useCreateBill(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.createBill(admissionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) }),
  });
}

export function useUpdateBill(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { discount_percent?: number } }) =>
      api.updateBill(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) }),
  });
}

export function useAddBedCharges(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.addBedCharges(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) }),
  });
}

export function useAddPayment(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: { amount: number; payment_mode: string; notes?: string };
    }) => api.addPayment(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) });
      qc.invalidateQueries({ queryKey: ipdKeys.billPayments(id) });
    },
  });
}

export function useCreateBillItem(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BillItemCreatePayload) => api.createBillItem(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) }),
  });
}

export function useUpdateBillItem(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<BillItemCreatePayload> }) =>
      api.updateBillItem(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) }),
  });
}

export function useDeleteBillItem(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteBillItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) }),
  });
}

export function useBillPayments(billId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(billId);
  return useQuery({
    queryKey: ipdKeys.billPayments(billId ?? 0),
    queryFn: () => listBillPayments(billId as number),
    enabled,
  });
}

export function useBillTemplates(search?: string) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ipdKeys.billTemplates(search),
    queryFn: () => api.listBillTemplates(search),
    enabled,
  });
}

export function useCreateBillTemplateFromBill(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bill, name, description }: { bill: number; name: string; description?: string }) =>
      api.createBillTemplateFromBill(bill, name, description),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ipd", "bill-templates"] }),
  });
}

export function useApplyBillTemplate(admissionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, bill }: { templateId: number; bill: number }) =>
      api.applyBillTemplate(templateId, bill),
    onSuccess: () => qc.invalidateQueries({ queryKey: ipdKeys.bills(admissionId) }),
  });
}

// ─── Consents & Stationery ──────────────────────────────────────────────

export function useDocumentTemplates(docType: DocumentType) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: ipdKeys.documentTemplates(docType),
    queryFn: () => listDocumentTemplates(docType),
    enabled,
    staleTime: 5 * 60_000,
  });
}
