/**
 * Clinical Records hooks.
 *
 * __demo: true — for now these return the static fixtures from
 * `constants.ts`. The shape mirrors what a future API would return, so the
 * screens don't need to change when a live endpoint lands. Each hook just
 * swaps to a `useQuery({ queryFn: ... })` against `lib/api/clinicalRecords`.
 *
 * Filter / search are applied client-side over the demo data. A real API
 * would take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import {
  DEMO_CLINICAL_RECORDS,
  type ClinicalRecordEncounterType,
  type ClinicalRecordEntry,
} from "./constants";

export interface UseClinicalRecordsListParams {
  /** Free-text search across patient name, id, record ref, and record name. */
  search?: string;
  /** Filter by encounter type. `all` (or undefined) returns everything. */
  encounterType?: "all" | ClinicalRecordEncounterType;
}

export interface UseClinicalRecordsListResult {
  data: ClinicalRecordEntry[];
  isLoading: boolean;
  isError: boolean;
  /** Subset of the dataset before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function useClinicalRecordsList(
  params: UseClinicalRecordsListParams = {}
): UseClinicalRecordsListResult {
  const { search, encounterType = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_CLINICAL_RECORDS.filter((r) => {
      if (encounterType !== "all" && r.encounterType !== encounterType) return false;
      if (q.length === 0) return true;
      return (
        r.patientName.toLowerCase().includes(q) ||
        r.patientId.toLowerCase().includes(q) ||
        r.recordRef.toLowerCase().includes(q) ||
        r.recordName.toLowerCase().includes(q) ||
        r.encounterRef.toLowerCase().includes(q)
      );
    });
  }, [search, encounterType]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_CLINICAL_RECORDS.length,
  };
}

/**
 * Look up a single record by id. Receives the same shape a future API would
 * return — the eventual implementation will read `/clinical-records/{id}`.
 */
export function useClinicalRecord(id: string | null | undefined): {
  data: ClinicalRecordEntry | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_CLINICAL_RECORDS.find((r) => r.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
