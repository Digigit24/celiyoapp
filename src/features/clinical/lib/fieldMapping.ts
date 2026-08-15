/**
 * Ported verbatim from celiyohms/src/features/clinical/components/
 * EmrWorkspace.tsx — the exact per-field-type serialization the backend's
 * grid-to-Prescription/DiagnosticOrder reconciliation depends on. Matching
 * upstream, dirty-key/upsert matching is by plain `field_key` (not the
 * instance_key-qualified runtime key) — repeatable *section instances* (as
 * opposed to repeatable *forms*, which use record occurrences instead) are
 * an edge case upstream doesn't fully cover either; not diverging from it.
 */
import type {
  ClinicalFieldValue,
  ClinicalForm,
  ClinicalFormField,
  ClinicalFormSection,
  ClinicalFormStructure,
  FieldValueUpsertItem,
} from "../../../types/clinical";
import { evaluateVisibility, readVisibilityRule } from "./visibility";

export function fieldValueToValue(fv: ClinicalFieldValue): unknown {
  if (fv.value_json !== null && fv.value_json !== undefined) return fv.value_json;
  if (fv.value_datetime) return fv.value_datetime;
  if (fv.value_time) return fv.value_time;
  if (fv.value_text !== null) return fv.value_text;
  if (fv.value_number !== null) return fv.value_number;
  if (fv.value_boolean !== null) return fv.value_boolean;
  if (fv.value_date !== null) return fv.value_date;
  return "";
}

export function buildInitialValues(
  record?: { field_values?: ClinicalFieldValue[] } | null
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  record?.field_values?.forEach((fv) => {
    values[fv.field_key] = fieldValueToValue(fv);
  });
  return values;
}

export function fieldsFromStructure(structure?: ClinicalFormStructure | null): ClinicalFormField[] {
  return structure?.sections.flatMap((section) => section.section_fields ?? []) ?? [];
}

export function getRuntimeFieldKey(section: ClinicalFormSection, field: ClinicalFormField): string {
  return section.instance_key ? `${section.instance_key}.${field.field_key}` : field.field_key;
}

function isEmptyValue(_field: ClinicalFormField, value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return Number.isNaN(value);
  if (typeof value === "object") return Object.keys(value as Record<string, unknown>).length === 0;
  return String(value).trim() === "";
}

export function validateRequiredFields(
  structure: ClinicalFormStructure,
  values: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const section of structure.sections ?? []) {
    if (!evaluateVisibility(readVisibilityRule(section.config, section.visibility_rule), values)) continue;
    for (const field of section.section_fields ?? []) {
      if (!field.is_required) continue;
      if (field.field_type === "heading" || field.field_type === "signature") continue;
      if (!evaluateVisibility(readVisibilityRule(field.config), values)) continue;
      const key = getRuntimeFieldKey(section, field);
      const value = values[key] ?? values[field.field_key];
      if (isEmptyValue(field, value)) {
        errors[key] = `${field.label} is required`;
      }
    }
  }
  return errors;
}

export function mapFieldToUpsertItem(
  field: ClinicalFormField,
  value: unknown
): FieldValueUpsertItem | null {
  if (value === undefined || value === "") return null;
  if (field.field_type === "grid" || field.field_type === "multiselect") {
    return { field_id: field.id, value_json: value };
  }
  if (field.field_type === "number") {
    return {
      field_id: field.id,
      value_text: String(value),
      value_number: typeof value === "number" ? value : String(value),
    };
  }
  if (field.field_type === "boolean") {
    return { field_id: field.id, value_boolean: Boolean(value), value_text: String(value) };
  }
  if (field.field_type === "date") {
    return { field_id: field.id, value_date: String(value), value_text: String(value) };
  }
  if (field.field_type === "datetime") {
    return { field_id: field.id, value_datetime: String(value), value_text: String(value) };
  }
  if (field.field_type === "time") {
    return { field_id: field.id, value_time: String(value), value_text: String(value) };
  }
  const isJsonValue =
    value !== null &&
    typeof value === "object" &&
    (Array.isArray(value) ||
      Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null);
  if (isJsonValue) {
    return { field_id: field.id, value_json: value };
  }
  return { field_id: field.id, value_text: String(value) };
}

/** Maps only the dirty field keys to upsert items — the payload autosave actually sends. */
export function buildUpsertPayloadForKeys(
  structure: ClinicalFormStructure,
  values: Record<string, unknown>,
  keys: Iterable<string>
): FieldValueUpsertItem[] {
  const keySet = new Set(keys);
  return fieldsFromStructure(structure)
    .filter((field) => keySet.has(field.field_key))
    .map((field) => mapFieldToUpsertItem(field, values[field.field_key]))
    .filter((item): item is FieldValueUpsertItem => item !== null);
}

export function formPrintTemplateCode(form: ClinicalForm | undefined | null): string {
  return form?.print_template_code ?? "clinical_form";
}
