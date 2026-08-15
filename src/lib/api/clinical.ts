/**
 * dghms clinical-form engine (/api/clinical/*) — the "EmrWorkspace" backend.
 * Endpoint shapes confirmed against apps/clinical/views.py, not just docs.
 */
import { hmsDelete, hmsGet, hmsPatch, hmsPost, type Paginated } from "./hmsClient";
import type {
  BulkUpsertPayload,
  ClinicalFieldValue,
  ClinicalForm,
  ClinicalFormStructure,
  ClinicalFormTemplate,
  ClinicalPicklist,
  ClinicalPicklistItem,
  ClinicalRecord,
  EncounterFormState,
  EntityType,
} from "../../types/clinical";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export function listClinicalForms(entityType?: EntityType) {
  return hmsGet<Paginated<ClinicalForm>>("/clinical/forms", {
    params: { page_size: 200, ...(entityType ? { entity_type: entityType } : {}) },
  }).then((r) => r.results);
}

export function getFormStructure(formId: number) {
  return hmsGet<Envelope<ClinicalFormStructure>>(
    `/clinical/forms/${formId}/structure`
  ).then((r) => r.data);
}

export function getEncounterForms(encounterType: EntityType, encounterId: number) {
  return hmsGet<Envelope<EncounterFormState[]>>(
    `/clinical/encounters/${encounterType}/${encounterId}/forms`
  ).then((r) => r.data);
}

export function getRecord(recordId: number) {
  return hmsGet<ClinicalRecord>(`/clinical/records/${recordId}`);
}

export function createRecord(payload: {
  form: number;
  encounter_type: EntityType;
  encounter_id: number;
  patient_user_id?: string;
}) {
  return hmsPost<ClinicalRecord>("/clinical/records", payload);
}

export function bulkUpsertValues(recordId: number, payload: BulkUpsertPayload) {
  return hmsPost<Envelope<ClinicalFieldValue[]>>(
    `/clinical/records/${recordId}/bulk-upsert-values`,
    payload
  );
}

export function completeRecord(recordId: number) {
  return hmsPost<Envelope<ClinicalRecord>>(`/clinical/records/${recordId}/complete`);
}

export function lockRecord(recordId: number) {
  return hmsPost<Envelope<ClinicalRecord>>(`/clinical/records/${recordId}/lock`);
}

export function unlockRecord(recordId: number) {
  return hmsPost<Envelope<ClinicalRecord>>(`/clinical/records/${recordId}/unlock`);
}

export function updateRecord(recordId: number, payload: Partial<ClinicalRecord>) {
  return hmsPatch<ClinicalRecord>(`/clinical/records/${recordId}`, payload);
}

export function listPicklists() {
  return hmsGet<Paginated<ClinicalPicklist>>("/clinical/picklists", {
    params: { page_size: 200 },
  }).then((r) => r.results);
}

export function listPicklistItems(picklistId: number) {
  return hmsGet<Paginated<ClinicalPicklistItem>>(
    `/clinical/picklists/${picklistId}/items`,
    { params: { page_size: 500 } }
  ).then((r) => r.results);
}

export function createPicklistItem(payload: { picklist: number; label: string; value?: string }) {
  return hmsPost<ClinicalPicklistItem>("/clinical/picklist-items", payload);
}

export function listFormTemplates(formId: number) {
  return hmsGet<Paginated<ClinicalFormTemplate>>("/clinical/form-templates", {
    params: { form: formId, page_size: 50 },
  }).then((r) => r.results);
}

export function createFormTemplate(payload: {
  form: number;
  name: string;
  description?: string;
  values: Record<string, unknown>;
}) {
  return hmsPost<ClinicalFormTemplate>("/clinical/form-templates", payload);
}

export function deleteFormTemplate(id: number) {
  return hmsDelete(`/clinical/form-templates/${id}`);
}

export function importFromOpd(recordId: number, overwrite = false) {
  return hmsPost<Envelope<ClinicalFieldValue[]>>(`/clinical/records/${recordId}/import-from-opd`, {
    overwrite,
  });
}
