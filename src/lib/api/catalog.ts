/**
 * Search-only access to dghms's OPD billing catalogs (procedures/services/
 * packages) — used by the IPD Billing tab's catalog picker. Mirrors
 * diagnostics.ts's searchInvestigations pattern. list/retrieve on these
 * viewsets requires the `hms.opd.bill` permission (same gate as billing
 * itself), so this is only reachable by billing-capable staff.
 */
import { hmsGet, type Paginated } from "./hmsClient";

export interface ProcedureMasterOption {
  id: number;
  name: string;
  code: string;
  category: string;
  default_charge: string;
}

export interface ServiceOption {
  id: number;
  name: string;
  code: string;
  category: string;
  default_charge: string;
}

export interface ProcedurePackageOption {
  id: number;
  name: string;
  code: string;
  total_charge: string;
  discounted_charge: string;
}

export function searchProcedures(search: string) {
  return hmsGet<Paginated<ProcedureMasterOption>>("/opd/procedure-masters", {
    params: { search, page_size: 20, is_active: true },
  }).then((r) => r.results);
}

export function searchServices(search: string) {
  return hmsGet<Paginated<ServiceOption>>("/opd/services", {
    params: { search, page_size: 20, is_active: true },
  }).then((r) => r.results);
}

export function searchPackages(search: string) {
  return hmsGet<Paginated<ProcedurePackageOption>>("/opd/procedure-packages", {
    params: { search, page_size: 20, is_active: true },
  }).then((r) => r.results);
}
