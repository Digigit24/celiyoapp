/**
 * Clinical Records hooks — TanStack Query wrappers around
 * `src/lib/api/clinicalRecords.ts`. Read + lock/unlock/complete/delete only
 * — there is no create mutation here (records are created from inside an
 * OPD/IPD encounter via the live EMR engine, `src/features/clinical/`).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/clinicalRecords";
import { useAuth } from "../../store/AuthContext";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const clinicalRecordsKeys = {
  list: (params?: api.ClinicalRecordListParams) => ["clinicalRecords", "list", params ?? {}] as const,
  detail: (id: number) => ["clinicalRecords", "detail", id] as const,
};

export function useClinicalRecordsList(params?: api.ClinicalRecordListParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: clinicalRecordsKeys.list(params),
    queryFn: () => api.listClinicalRecords(params),
    enabled,
  });
}

export function useClinicalRecord(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: clinicalRecordsKeys.detail(id ?? 0),
    queryFn: () => api.getClinicalRecord(id as number),
    enabled,
  });
}

function useRecordAction(mutationFn: (id: number) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: clinicalRecordsKeys.detail(id as number) });
      qc.invalidateQueries({ queryKey: ["clinicalRecords", "list"] });
    },
  });
}

export function useLockRecord() {
  return useRecordAction(api.lockClinicalRecord);
}

export function useUnlockRecord() {
  return useRecordAction(api.unlockClinicalRecord);
}

export function useCompleteRecord() {
  return useRecordAction(api.completeClinicalRecord);
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteClinicalRecord(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinicalRecords", "list"] }),
  });
}
