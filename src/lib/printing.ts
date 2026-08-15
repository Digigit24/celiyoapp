/**
 * Server-side print → OS share sheet. Never generate PDFs on-device — always
 * request the rendered document from dghms's printing app and hand the
 * result to the OS share sheet per CLAUDE.md's printing contract.
 */
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { HMS_BASE_URL } from "./config";
import { getAuthRuntime } from "./auth/authRuntime";
import { hmsClient } from "./api/hmsClient";

/** Raw A4-styled HTML from dghms's printing app — same source the web app's PrintPreviewModal iframes. */
export async function fetchPrintPreviewHtml(formCode: string, recordId: number): Promise<string> {
  const { data } = await hmsClient.get<string>("/print/preview", {
    params: { form: formCode, record_id: recordId, letterhead: true, language: "en" },
    responseType: "text",
    transformResponse: (res) => res,
  });
  return data;
}

export async function printAndShare(formCode: string, recordId: number) {
  const { getAccessToken, getTenantHeaders } = getAuthRuntime();
  const token = getAccessToken();
  if (!token) throw new Error("Not signed in");
  const { tenantId, tenantSlug } = getTenantHeaders();

  const url = `${HMS_BASE_URL}/api/print/render/?form=${encodeURIComponent(
    formCode
  )}&record_id=${recordId}`;
  const destination = `${FileSystem.cacheDirectory}${formCode}_${recordId}.pdf`;

  const result = await FileSystem.downloadAsync(url, destination, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(tenantId ? { "x-tenant-id": tenantId } : {}),
      ...(tenantSlug ? { "x-tenant-slug": tenantSlug } : {}),
    },
  });

  if (result.status !== 200) {
    throw new Error(`Print render failed (HTTP ${result.status})`);
  }

  await shareFile(result.uri);
}

/** No `atob`/Buffer on Hermes — chunked manual base64 encode (avoids call-stack blowups on large PDFs). */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(buffer);
  let result = "";
  const chunkSize = 3000; // multiple of 3, keeps padding only at the very end
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    for (let i = 0; i < chunk.length; i += 3) {
      const b0 = chunk[i];
      const b1 = chunk[i + 1];
      const b2 = chunk[i + 2];
      result += chars[b0 >> 2];
      result += chars[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
      result += b1 === undefined ? "=" : chars[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
      result += b2 === undefined ? "=" : chars[b2 & 63];
    }
  }
  return result;
}

async function shareFile(uri: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device");
  }
  await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
}

/**
 * POST-based analogue of printAndShare — /print/documents/batch takes a JSON
 * body (template codes to merge) rather than a record_id, so it can't use
 * FileSystem.downloadAsync (GET-only). Fetches via axios as an arraybuffer,
 * base64-encodes locally, writes to cache, then shares.
 */
export async function printDocumentsBatch(params: {
  templateCodes: string[];
  encounterType: "ipd_admission" | "opd_visit";
  encounterId: number;
  language?: "en" | "mr";
  letterhead?: boolean;
}) {
  const response = await hmsClient.post(
    "/print/documents/batch",
    {
      template_codes: params.templateCodes,
      encounter_type: params.encounterType,
      encounter_id: params.encounterId,
      language: params.language ?? "en",
      letterhead: params.letterhead ?? true,
    },
    { responseType: "arraybuffer" }
  );

  const base64 = arrayBufferToBase64(response.data as ArrayBuffer);
  const destination = `${FileSystem.cacheDirectory}documents_${params.encounterId}_${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(destination, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await shareFile(destination);
}

/**
 * Merges many records of the same form (e.g. every round-note occurrence)
 * into a single PDF — "Print Multiple" on web. Same POST+arraybuffer+share
 * approach as printDocumentsBatch, since /print/batch also takes a JSON body.
 */
export async function printBatch(formCode: string, recordIds: number[]) {
  const response = await hmsClient.post(
    "/print/batch",
    { form: formCode, record_ids: recordIds, letterhead: true, language: "en" },
    { responseType: "arraybuffer" }
  );
  const base64 = arrayBufferToBase64(response.data as ArrayBuffer);
  const destination = `${FileSystem.cacheDirectory}batch_${formCode}_${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(destination, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await shareFile(destination);
}
