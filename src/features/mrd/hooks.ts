/**
 * MRD hooks — worklist, dossier, export. Backed by the real dghms `/mrd/*`
 * endpoints (`src/lib/api/mrd.ts`). No `hms.mrd.*` permission exists on this
 * app — any signed-in user can use every hook here (see CLAUDE.md /
 * ADMIN-vs-MRD backend-contract note), so there's no permission gating.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../store/AuthContext";
import * as api from "../../lib/api/mrd";
import type { MrdExportCreatePayload } from "../../types/mrd";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const mrdKeys = {
  worklist: (params?: api.MrdWorklistParams) => ["mrd", "worklist", params ?? {}] as const,
  dossier: (patientId: number, params?: api.MrdDossierParams) =>
    ["mrd", "dossier", patientId, params ?? {}] as const,
};

/** Search-driven patient worklist — `search` omitted returns the 100 most recently updated patients. */
export function useMrdWorklist(search?: string) {
  const enabled = useSignedIn();
  const params: api.MrdWorklistParams | undefined = search?.trim() ? { search: search.trim() } : undefined;
  return useQuery({
    queryKey: mrdKeys.worklist(params),
    queryFn: () => api.getMrdWorklist(params),
    enabled,
  });
}

/** A patient's dossier — encounters + document checklist + completeness, optionally scoped to one encounter. */
export function useMrdDossier(patientId: number | null | undefined, params?: api.MrdDossierParams) {
  const enabled = useSignedIn() && Boolean(patientId);
  return useQuery({
    queryKey: mrdKeys.dossier(patientId ?? 0, params),
    queryFn: () => api.getMrdDossier(patientId as number, params),
    enabled,
  });
}

/**
 * Fully synchronous — the mutation result already reflects "completed" or
 * "failed". No query to invalidate: there's no export-history endpoint to
 * refetch from (track past exports in the calling screen's local state).
 */
export function useCreateMrdExport() {
  return useMutation({
    mutationFn: (payload: MrdExportCreatePayload) => api.createMrdExport(payload),
  });
}
