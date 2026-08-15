/** React-query hooks over the clinical-form API, mirroring celiyohms's clinicalKeys.* namespace. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/clinical";
import type { BulkUpsertPayload, EntityType } from "../../types/clinical";

export const clinicalKeys = {
  forms: (entityType?: EntityType) => ["clinical", "forms", entityType ?? "all"] as const,
  structure: (formId: number) => ["clinical", "forms", formId, "structure"] as const,
  encounterForms: (encounterType: EntityType, encounterId: number) =>
    ["clinical", "encounters", encounterType, encounterId, "forms"] as const,
  record: (recordId: number) => ["clinical", "records", recordId] as const,
  picklistItems: (picklistId: number) => ["clinical", "picklists", picklistId, "items"] as const,
};

export function useEncounterForms(encounterType: EntityType, encounterId: number) {
  return useQuery({
    queryKey: clinicalKeys.encounterForms(encounterType, encounterId),
    queryFn: () => api.getEncounterForms(encounterType, encounterId),
    enabled: encounterId > 0,
  });
}

export function useFormStructure(formId: number | null | undefined) {
  return useQuery({
    queryKey: clinicalKeys.structure(formId ?? 0),
    queryFn: () => api.getFormStructure(formId as number),
    enabled: Boolean(formId && formId > 0),
    staleTime: 5 * 60_000,
  });
}

export function useRecord(recordId: number | null | undefined) {
  return useQuery({
    queryKey: clinicalKeys.record(recordId ?? 0),
    queryFn: () => api.getRecord(recordId as number),
    enabled: Boolean(recordId && recordId > 0),
  });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRecord,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: clinicalKeys.encounterForms(variables.encounter_type, variables.encounter_id),
      });
    },
  });
}

export function useBulkUpsertValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      recordId,
      payload,
      silent,
    }: {
      recordId: number;
      payload: BulkUpsertPayload;
      silent?: boolean;
    }) => api.bulkUpsertValues(recordId, payload),
    onSuccess: (_data, variables) => {
      if (variables.silent) return;
      qc.invalidateQueries({ queryKey: clinicalKeys.record(variables.recordId) });
    },
  });
}

export function useCompleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number) => api.completeRecord(recordId),
    onSuccess: (_data, recordId) => {
      qc.invalidateQueries({ queryKey: clinicalKeys.record(recordId) });
    },
  });
}

export function useLockRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number) => api.lockRecord(recordId),
    onSuccess: (_data, recordId) => qc.invalidateQueries({ queryKey: clinicalKeys.record(recordId) }),
  });
}

export function useUnlockRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId: number) => api.unlockRecord(recordId),
    onSuccess: (_data, recordId) => qc.invalidateQueries({ queryKey: clinicalKeys.record(recordId) }),
  });
}

export function usePicklistItems(picklistId: number | null | undefined) {
  return useQuery({
    queryKey: clinicalKeys.picklistItems(picklistId ?? 0),
    queryFn: () => api.listPicklistItems(picklistId as number),
    enabled: Boolean(picklistId && picklistId > 0),
    staleTime: 5 * 60_000,
  });
}

export function useCreatePicklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createPicklistItem,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: clinicalKeys.picklistItems(variables.picklist) });
    },
  });
}
