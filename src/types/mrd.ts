/**
 * Types for dghms's MRD (Medical Records Department) domain (/api/mrd/*).
 *
 * MRD here means "MRD staff assembles a printable document packet for a
 * patient" — not a physical-file custody tracker (there's no backend
 * equivalent for that concept). Endpoint shapes confirmed against dghms's
 * apps/mrd source directly, not inferred from celiyohms.
 */

/** A row in the MRD worklist — `GET /mrd/worklist`. */
export interface MrdWorklistItem {
  patient_id: number;
  patient_name: string;
  patient_id_display: string;
  age: number | null;
  gender: string;
  mobile: string;
}

/** No pagination envelope — plain `{results}`, capped at 100 rows server-side. */
export interface MrdWorklistResponse {
  results: MrdWorklistItem[];
}

export type MrdEncounterType = "ipd" | "opd" | "daycare";

export interface MrdEncounter {
  id: number;
  type: MrdEncounterType;
  label: string;
  date: string;
  status: string;
}

export type MrdManifestSourceType = "clinical_record" | "admission";

/** One selectable document in the dossier checklist. `id` is the exact string to send back in `item_ids`. */
export interface MrdManifestItem {
  /** e.g. "clinical:5" or "admission:12" — pass verbatim in the export payload. */
  id: string;
  title: string;
  category: string;
  status: "ready";
  source_type: MrdManifestSourceType;
  source_id: number;
  encounter_id: number;
  encounter_type: MrdEncounterType;
  created_at: string;
  /** Only present on clinical-record items. */
  preview_url?: string;
  required: boolean;
}

export interface MrdCompleteness {
  ready: number;
  total: number;
  missing: number;
  percent: number;
}

/** `GET /mrd/patients/{patient_id}/dossier` response. */
export interface MrdDossier {
  patient: MrdWorklistItem;
  encounters: MrdEncounter[];
  manifest: MrdManifestItem[];
  completeness: MrdCompleteness;
}

export interface MrdExportCreatePayload {
  patient_id: number;
  /** Manifest item ids to include — at least one required. */
  item_ids: string[];
}

/**
 * `POST /mrd/exports` response — fully synchronous, already reflects the
 * terminal state. NOTE: `download_url` has a server bug (wrong prefix) —
 * callers should ignore it and construct `/mrd/exports/{id}/download`
 * themselves (see `lib/api/mrd.ts#downloadAndShareMrdExport`).
 */
export interface MrdExportResult {
  id: string;
  status: "completed" | "failed";
  progress: number;
  download_url: string;
}

/** Client-side-only record of an export triggered this session (no server history endpoint exists). */
export interface MrdSessionExport {
  id: string;
  status: "completed" | "failed";
  itemCount: number;
  createdAt: number;
}
