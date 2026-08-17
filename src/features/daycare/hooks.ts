/**
 * Daycare hooks.
 *
 * __demo: true — for now these return the static fixtures from
 * `constants.ts`. The shape mirrors what a future API would return, so the
 * screens don't need to change when a live endpoint lands. Each hook just
 * swaps to a `useQuery({ queryFn: ... })` against `lib/api/daycare`.
 *
 * Filter / search are applied client-side over the demo data. A real API
 * would take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import {
  DEMO_DAYCARE_SESSIONS,
  type DaycareSession,
  type DaycareStatus,
} from "./constants";

export interface UseDaycareListParams {
  /** Free-text search across patient name, id, and session ref. */
  search?: string;
  /** Filter by status. `all` (or undefined) returns everything. */
  status?: "all" | DaycareStatus;
}

export interface UseDaycareListResult {
  data: DaycareSession[];
  isLoading: boolean;
  isError: boolean;
  /** Subset of the dataset before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function useDaycareList(
  params: UseDaycareListParams = {}
): UseDaycareListResult {
  const { search, status = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_DAYCARE_SESSIONS.filter((s) => {
      if (status !== "all" && s.status !== status) return false;
      if (q.length === 0) return true;
      return (
        s.patientName.toLowerCase().includes(q) ||
        s.patientId.toLowerCase().includes(q) ||
        s.sessionRef.toLowerCase().includes(q)
      );
    });
  }, [search, status]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_DAYCARE_SESSIONS.length,
  };
}

/**
 * Look up a single session by id. Receives the same shape a future API
 * would return — the eventual implementation will read `/daycare/{id}`.
 */
export function useDaycareSession(id: string | null | undefined): {
  data: DaycareSession | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_DAYCARE_SESSIONS.find((s) => s.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
