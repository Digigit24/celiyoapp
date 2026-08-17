import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/pharmacy";
import { useAuth } from "../../store/AuthContext";
import type {
  AddPrescriptionItemPayload,
  DispensePayload,
  PrescriptionCreatePayload,
  UpdatePrescriptionItemPayload,
} from "../../types/pharmacy";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const pharmacyKeys = {
  list: (params?: api.PrescriptionListParams) => ["pharmacy", "prescriptions", "list", params ?? {}] as const,
  detail: (id: number) => ["pharmacy", "prescriptions", "detail", id] as const,
};

export function usePrescriptionsList(params?: api.PrescriptionListParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: pharmacyKeys.list(params),
    queryFn: () => api.listPrescriptions(params),
    enabled,
  });
}

export function usePrescription(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: pharmacyKeys.detail(id ?? 0),
    queryFn: () => api.getPrescription(id as number),
    enabled,
  });
}

export function useCreatePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PrescriptionCreatePayload) => api.createPrescription(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy", "prescriptions"] }),
  });
}

export function useDeletePrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletePrescription(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy", "prescriptions"] }),
  });
}

export function useAddPrescriptionItem(prescriptionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddPrescriptionItemPayload) => api.addPrescriptionItem(prescriptionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pharmacyKeys.detail(prescriptionId) });
      qc.invalidateQueries({ queryKey: ["pharmacy", "prescriptions", "list"] });
    },
  });
}

export function useUpdatePrescriptionItem(prescriptionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePrescriptionItemPayload) => api.updatePrescriptionItem(prescriptionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pharmacyKeys.detail(prescriptionId) });
      qc.invalidateQueries({ queryKey: ["pharmacy", "prescriptions", "list"] });
    },
  });
}

export function useRemovePrescriptionItem(prescriptionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => api.removePrescriptionItem(prescriptionId, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pharmacyKeys.detail(prescriptionId) });
      qc.invalidateQueries({ queryKey: ["pharmacy", "prescriptions", "list"] });
    },
  });
}

export function useDispensePrescription(prescriptionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: DispensePayload) => api.dispensePrescription(prescriptionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pharmacyKeys.detail(prescriptionId) });
      qc.invalidateQueries({ queryKey: ["pharmacy", "prescriptions", "list"] });
    },
  });
}
