/**
 * Types for the Clinical Records browser (`/api/clinical/records`) — a
 * read-mostly, cross-encounter, cross-patient INDEX over records created by
 * the live EMR engine at `src/features/clinical/` (untouched by this
 * module). Base shapes (`ClinicalRecord`, `ClinicalFieldValue`,
 * `ClinicalFormStructure`, `FieldType`) are re-exported from
 * `src/types/clinical.ts` — the engine's own types — since this browser
 * reads exactly what that engine wrote, just without a create path.
 *
 * Note the encounter_type convention here is the clinical-form engine's own
 * underscore form (`opd_visit` / `ipd_admission`, see `EntityType` in
 * `types/clinical.ts`) — NOT diagnostics' dotted `opd.visit`/`ipd.admission`
 * (`src/types/diagnostics.ts`). Two different dghms apps, two different
 * conventions; don't conflate them.
 */

export type {
  ClinicalRecord,
  ClinicalFieldValue,
  ClinicalFormStructure,
  ClinicalFormField,
  ClinicalFormSection,
  EntityType as ClinicalRecordEncounterType,
  RecordStatus as ClinicalRecordStatus,
  FieldType,
} from "./clinical";

import type { ClinicalRecord } from "./clinical";

/** List-row shape — the same `ClinicalRecord`, `field_values` just isn't requested/rendered here. */
export type ClinicalRecordListItem = ClinicalRecord;

/** Detail shape — same resource, `field_values[]` is what the detail screen renders. */
export type ClinicalRecordDetail = ClinicalRecord;

/** One (label, value, field_type) triple produced by joining `field_values[]` against `structure_snapshot`. */
export interface RenderedFieldValue {
  fieldKey: string;
  label: string;
  value: string;
  fieldType: string;
}
