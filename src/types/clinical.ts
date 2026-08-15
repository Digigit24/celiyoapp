/**
 * Types for dghms's generic clinical-form engine (/api/clinical/*).
 * Ported from celiyohms/src/features/clinical/types.ts — this is the
 * "EmrWorkspace" system CLAUDE.md refers to, distinct from the older
 * OPD-only ClinicalNoteTemplate* system at /api/opd/template-*.
 */

export type EntityType = "opd_visit" | "ipd_admission" | "generic";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "time"
  | "picklist"
  | "multiselect"
  | "file"
  | "calculated"
  | "yes_no"
  | "grid"
  | "signature"
  | "heading"
  | "data_ref"
  | "rich_text"
  | "api_select"
  | "pain_faces"
  | "body_diagram";

export type RecordStatus = "in_progress" | "completed" | "locked";
export type FormStatus = "draft" | "staging" | "published" | "archived";
export type PrintTemplateCode =
  | "clinical_form"
  | "nursing_paper"
  | "monitoring_chart"
  | "progress_sheet"
  | "jeevisha_pain_opd";

export interface ClinicalForm {
  id: number;
  tenant_id: string;
  code: string;
  name: string;
  description: string;
  version: number;
  status: FormStatus;
  is_system: boolean;
  entity_type: EntityType;
  print_template_code: PrintTemplateCode | string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
}

export type VisibilityOperator =
  | "eq"
  | "neq"
  | "in"
  | "gt"
  | "lt"
  | "empty"
  | "notempty";

export interface VisibilityCondition {
  field: string;
  op: VisibilityOperator;
  value?: unknown;
}

export type VisibilityRule =
  | Record<string, never>
  | { all: VisibilityRule[] }
  | { any: VisibilityRule[] }
  | { not: VisibilityRule }
  | VisibilityCondition;

export interface ClinicalPicklistItem {
  id: number;
  picklist: number;
  label: string;
  value: string;
  display_order: number;
  is_active: boolean;
}

export interface ClinicalFormSection {
  id: number;
  tenant_id: string;
  form?: number;
  placement_id?: number;
  instance_key?: string | null;
  title_override?: string | null;
  code: string;
  title: string;
  description: string;
  display_order: number;
  is_collapsed: boolean;
  visibility_rule?: VisibilityRule;
  config: Record<string, unknown>;
  is_active: boolean;
  sync_pharmacy: boolean;
  sync_lab: boolean;
  print_on_discharge: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  section_fields?: ClinicalFormField[];
}

export interface GridColumn {
  key: string;
  label: string;
  type?: FieldType | "textarea";
  picklist?: number | string;
  picklist_code?: string;
  allow_inline_create?: boolean;
  width?: string | number;
}

export interface GridSchema {
  columns: GridColumn[];
  min_rows?: number;
  max_rows?: number;
  allow_add?: boolean;
  default_rows?: Array<Record<string, unknown>>;
  layout?: "table" | "stacked";
}

export interface ClinicalFormField {
  id: number;
  tenant_id: string;
  section: number;
  field_key: string;
  field_type: FieldType;
  label: string;
  label_mr?: string;
  help_text: string;
  display_order: number;
  is_required: boolean;
  is_read_only: boolean;
  default_value: unknown | null;
  config: Record<string, unknown>;
  picklist: number | null;
  picklist_items?: ClinicalPicklistItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
}

export interface ClinicalFormStructure extends ClinicalForm {
  sections: Array<ClinicalFormSection & { section_fields: ClinicalFormField[] }>;
}

export interface RecordOccurrence {
  record_id: number;
  occurrence_index: number;
  status: RecordStatus;
  is_locked: boolean;
  created_at: string;
}

export interface EncounterFormState {
  form: ClinicalForm;
  filled: boolean;
  completed: boolean;
  record_id: number | null;
  record_status: RecordStatus | null;
  repeatable?: boolean;
  occurrences?: RecordOccurrence[];
}

export interface ClinicalFieldValue {
  id: number;
  tenant_id: string;
  record: number;
  field: number;
  field_key: string;
  field_type: FieldType;
  value_text: string | null;
  value_number: string | null;
  value_boolean: boolean | null;
  value_date: string | null;
  value_datetime?: string | null;
  value_time?: string | null;
  value_json: unknown | null;
  picklist_item?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
}

export interface ClinicalRecord {
  id: number;
  tenant_id: string;
  form: number;
  form_code: string;
  form_name: string;
  form_print_template_code?: string;
  encounter_type: string;
  encounter_id: number;
  occurrence_index?: number;
  patient_user_id: string | null;
  status: RecordStatus;
  is_locked: boolean;
  locked_by_user_id: string | null;
  locked_at: string | null;
  version: number;
  form_version?: number;
  structure_snapshot?: ClinicalFormStructure | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_user_id: string | null;
  field_values?: ClinicalFieldValue[];
}

export interface FieldValueUpsertItem {
  field_id: number;
  value_text?: string | null;
  value_number?: string | number | null;
  value_boolean?: boolean | null;
  value_date?: string | null;
  value_datetime?: string | null;
  value_time?: string | null;
  value_json?: unknown;
  picklist_item_id?: number | null;
}

export interface BulkUpsertPayload {
  values: FieldValueUpsertItem[];
}

export interface ClinicalPicklist {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
}

/** A named, reusable snapshot of a form's {field_key: value} map ("save as template"). */
export interface ClinicalFormTemplate {
  id: number;
  tenant_id: string;
  form: number;
  name: string;
  description: string;
  values: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
