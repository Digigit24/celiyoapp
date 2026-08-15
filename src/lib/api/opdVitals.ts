/** dghms Visit Findings (/api/opd/visit-findings/) — distinct from the New Visit form's discarded vitals fields; these persist. */
import { hmsGet, hmsPost, type Paginated } from "./hmsClient";
import type { VisitFinding, VisitFindingCreatePayload } from "../../types/opd";

export function listVisitFindings(visitId: number) {
  return hmsGet<Paginated<VisitFinding>>("/opd/visit-findings", {
    params: { visit: visitId, ordering: "-finding_date", page_size: 20 },
  }).then((r) => r.results);
}

export function createVisitFinding(visitId: number, payload: VisitFindingCreatePayload) {
  return hmsPost<VisitFinding>("/opd/visit-findings", { visit: visitId, ...payload });
}
