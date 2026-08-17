/**
 * MRD (Medical Records Department) hooks.
 *
 * __demo: true — for now these return the static fixtures from
 * `constants.ts`. The shape mirrors what a future API would return, so the
 * screens don't need to change when a live endpoint lands. Each hook just
 * swaps to a `useQuery({ queryFn: ... })` against `lib/api/mrd`.
 *
 * Filter / search are applied client-side over the demo data. A real API
 * would take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import {
  DEMO_MRD_FILES,
  type MrdFileRecord,
  type MrdFileStatus,
} from "./constants";

export interface UseMrdListParams {
  /** Free-text search across patient name, id, and file number. */
  search?: string;
  /** Filter by status. `all` (or undefined) returns everything. */
  status?: "all" | MrdFileStatus;
}

export interface UseMrdListResult {
  data: MrdFileRecord[];
  isLoading: boolean;
  isError: boolean;
  /** Subset of the dataset before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function useMrdList(params: UseMrdListParams = {}): UseMrdListResult {
  const { search, status = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_MRD_FILES.filter((f) => {
      if (status !== "all" && f.status !== status) return false;
      if (q.length === 0) return true;
      return (
        f.patientName.toLowerCase().includes(q) ||
        f.patientId.toLowerCase().includes(q) ||
        f.fileNumber.toLowerCase().includes(q) ||
        f.currentCustody.toLowerCase().includes(q)
      );
    });
  }, [search, status]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_MRD_FILES.length,
  };
}

/**
 * Look up a single file record by id. Receives the same shape a future API
 * would return — the eventual implementation will read `/mrd/{id}`.
 */
export function useMrdFile(id: string | null | undefined): {
  data: MrdFileRecord | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_MRD_FILES.find((f) => f.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
