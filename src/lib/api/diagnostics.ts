/** Minimal dghms diagnostics API surface — investigation master search for the InvestigationGridField. */
import { hmsGet, type Paginated } from "./hmsClient";

export interface InvestigationOption {
  id: number;
  name: string;
  code: string;
  category: string;
  base_charge: string;
}

export function searchInvestigations(search: string) {
  return hmsGet<Paginated<InvestigationOption>>("/diagnostics/investigations", {
    params: { search, page_size: 20, is_active: true },
  }).then((r) => r.results);
}
