/** Consent/stationery document templates (/api/clinical/documents/templates). */
import { hmsGet, type Paginated } from "./hmsClient";
import type { ClinicalDocumentTemplate, DocumentType } from "../../types/ipd";

export function listDocumentTemplates(docType: DocumentType) {
  return hmsGet<Paginated<ClinicalDocumentTemplate>>("/clinical/documents/templates", {
    params: { doc_type: docType, page_size: 100 },
  }).then((r) => r.results);
}
