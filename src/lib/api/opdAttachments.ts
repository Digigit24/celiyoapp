/** dghms Visit Attachments (/api/opd/visit-attachments/) — X-ray/report/prescription files. */
import { hmsDelete, hmsGet, hmsPost, type Paginated } from "./hmsClient";
import type { AttachmentFileType, OpdAttachment } from "../../types/opd";

export function listAttachments(visitId: number) {
  return hmsGet<Paginated<OpdAttachment>>("/opd/visit-attachments", {
    params: { visit: visitId, page_size: 100 },
  }).then((r) => r.results);
}

export function uploadAttachment(
  visitId: number,
  file: { uri: string; name: string; mimeType: string },
  fileType: AttachmentFileType = "document"
) {
  const form = new FormData();
  form.append("visit", String(visitId));
  form.append("file_type", fileType);
  // React Native's FormData accepts this {uri,name,type} shape directly — not a real Blob/File.
  form.append("file", { uri: file.uri, name: file.name, type: file.mimeType } as unknown as Blob);

  return hmsPost<OpdAttachment>("/opd/visit-attachments", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export function deleteAttachment(id: number) {
  return hmsDelete(`/opd/visit-attachments/${id}`);
}
