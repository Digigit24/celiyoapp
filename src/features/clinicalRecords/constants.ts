/**
 * Clinical Records module — shared constants and display helpers.
 *
 * This is a cross-encounter records INDEX/browser over records the live EMR
 * engine (`src/features/clinical/`) already created — read + lock/unlock/
 * complete/delete only, no create path here. `src/features/clinical/` is
 * untouched by this module.
 *
 * The backend genuinely doesn't return a patient name, doctor name, or a
 * richer audit log than `created_at`/`updated_at`/`locked_at`/
 * `locked_by_user_id` — see `renderFieldValues` and the screens for how that
 * shapes the UI (no name lookups invented, no fabricated timeline).
 */

import type { ChipVariant } from "../../components/ui";
import type {
  ClinicalFieldValue,
  ClinicalFormField,
  ClinicalRecordDetail,
  ClinicalRecordEncounterType,
  ClinicalRecordStatus,
  RenderedFieldValue,
} from "../../types/clinicalRecords";

export const STATUS_LABELS: Record<ClinicalRecordStatus, string> = {
  in_progress: "In progress",
  completed: "Completed",
  locked: "Locked",
};

export const STATUS_CHIP_VARIANT: Record<ClinicalRecordStatus, ChipVariant> = {
  in_progress: "warning",
  completed: "success",
  locked: "info",
};

export const ENCOUNTER_TYPE_LABELS: Record<ClinicalRecordEncounterType, string> = {
  opd_visit: "OPD Visit",
  ipd_admission: "IPD Admission",
  generic: "Generic",
};

export const ENCOUNTER_TYPE_CHIP_VARIANT: Record<ClinicalRecordEncounterType, ChipVariant> = {
  opd_visit: "info",
  ipd_admission: "warning",
  generic: "neutral",
};

/**
 * `ClinicalRecord.encounter_type` is typed as a plain `string` on the wire
 * (see `types/clinical.ts`'s `EntityType` vs. the record field) — these
 * defensively fall back to the raw value / a neutral chip instead of a TS
 * index error or a crash if the backend ever returns something outside the
 * three known values.
 */
export function encounterTypeLabel(type: string): string {
  return ENCOUNTER_TYPE_LABELS[type as ClinicalRecordEncounterType] ?? type;
}

export function encounterTypeChipVariant(type: string): ChipVariant {
  return ENCOUNTER_TYPE_CHIP_VARIANT[type as ClinicalRecordEncounterType] ?? "neutral";
}

export const STATUS_FILTER_OPTIONS: Array<{ id: "all" | ClinicalRecordStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "locked", label: "Locked" },
];

export const ENCOUNTER_FILTER_OPTIONS: Array<{ id: "all" | ClinicalRecordEncounterType; label: string }> = [
  { id: "all", label: "All" },
  { id: "opd_visit", label: "OPD" },
  { id: "ipd_admission", label: "IPD" },
];

/** Compact display for an ISO datetime — "17 Aug · 10:42". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${d.getDate()} ${months[d.getMonth()]} · ${time}`;
}

/** Short id badge, e.g. a UUID truncated to its first segment — "a1b2c3d4…". */
export function truncateId(id: string | null | undefined, length = 8): string {
  if (!id) return "—";
  return id.length <= length ? id : `${id.slice(0, length)}…`;
}

function stringifyFieldValue(fieldValue: ClinicalFieldValue, field: ClinicalFormField | undefined): string {
  if (fieldValue.picklist_item != null) {
    const item = field?.picklist_items?.find((p) => p.id === fieldValue.picklist_item);
    if (item) return item.label;
  }
  if (fieldValue.value_boolean != null) return fieldValue.value_boolean ? "Yes" : "No";
  if (fieldValue.value_text) return fieldValue.value_text;
  if (fieldValue.value_number != null) return String(fieldValue.value_number);
  if (fieldValue.value_date) return fieldValue.value_date;
  if (fieldValue.value_datetime) return fieldValue.value_datetime;
  if (fieldValue.value_time) return fieldValue.value_time;
  if (fieldValue.value_json != null) {
    try {
      return typeof fieldValue.value_json === "string"
        ? fieldValue.value_json
        : JSON.stringify(fieldValue.value_json);
    } catch {
      return String(fieldValue.value_json);
    }
  }
  return "—";
}

/**
 * Joins a record's flat `field_values[]` against its own `structure_snapshot`
 * (both come back in the same detail response) to recover a human label and
 * a printable value per field — the read-only rendering this browser needs,
 * without re-implementing the full `ClinicalFormRenderer`.
 */
export function renderFieldValues(record: ClinicalRecordDetail): RenderedFieldValue[] {
  const fieldsByKey = new Map<string, ClinicalFormField>();
  for (const section of record.structure_snapshot?.sections ?? []) {
    for (const field of section.section_fields ?? []) {
      fieldsByKey.set(field.field_key, field);
    }
  }

  return (record.field_values ?? [])
    .filter((fv) => fv.is_active)
    .map((fv) => {
      const field = fieldsByKey.get(fv.field_key);
      return {
        fieldKey: fv.field_key,
        label: field?.label ?? fv.field_key,
        fieldType: field?.field_type ?? fv.field_type,
        value: stringifyFieldValue(fv, field),
      };
    });
}
