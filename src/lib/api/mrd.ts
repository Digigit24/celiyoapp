/**
 * dghms MRD API (/api/mrd/*) — confirmed against apps/mrd/views.py.
 *
 * Three endpoints only:
 * - GET /mrd/worklist — search-driven patient list (no pagination envelope).
 * - GET /mrd/patients/{id}/dossier — encounters + document checklist + completeness.
 * - POST /mrd/exports — synchronous PDF packet generation.
 *
 * There is NO GET /mrd/exports (no export history endpoint) — don't add one.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { hmsGet, hmsPost } from "./hmsClient";
import { HMS_BASE_URL } from "../config";
import { getAuthRuntime } from "../auth/authRuntime";
import type {
  MrdDossier,
  MrdEncounterType,
  MrdExportCreatePayload,
  MrdExportResult,
  MrdWorklistItem,
  MrdWorklistResponse,
} from "../../types/mrd";

export interface MrdWorklistParams {
  search?: string;
}

export function getMrdWorklist(params?: MrdWorklistParams): Promise<MrdWorklistItem[]> {
  return hmsGet<MrdWorklistResponse>("/mrd/worklist", { params }).then((r) => r.results);
}

export interface MrdDossierParams {
  encounter_type?: MrdEncounterType;
  encounter_id?: number;
}

export function getMrdDossier(patientId: number, params?: MrdDossierParams): Promise<MrdDossier> {
  return hmsGet<MrdDossier>(`/mrd/patients/${patientId}/dossier`, { params });
}

export function createMrdExport(payload: MrdExportCreatePayload): Promise<MrdExportResult> {
  return hmsPost<MrdExportResult>("/mrd/exports", payload);
}

/**
 * The `download_url` the backend returns in the export response is buggy
 * (wrong `/api/hms/mrd/...` prefix) — intentionally ignored here. This
 * constructs `/mrd/exports/{id}/download` directly against the dghms base
 * and downloads+shares the binary PDF, same expo-file-system/expo-sharing
 * pattern `src/lib/printing.ts` uses for every other PDF download in this
 * app (kept self-contained here rather than importing from printing.ts,
 * which is out of this module's scope to touch).
 */
export async function downloadAndShareMrdExport(exportId: string): Promise<void> {
  const { getAccessToken, getTenantHeaders } = getAuthRuntime();
  const token = getAccessToken();
  if (!token) throw new Error("Not signed in");
  const { tenantId, tenantSlug } = getTenantHeaders();

  const url = `${HMS_BASE_URL}/api/mrd/exports/${exportId}/download`;
  const destination = `${FileSystem.cacheDirectory}mrd_export_${exportId}.pdf`;

  const result = await FileSystem.downloadAsync(url, destination, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
    },
  });

  if (result.status !== 200) {
    throw new Error(`MRD export download failed (HTTP ${result.status})`);
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device");
  }
  await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
}
