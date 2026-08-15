/** dghms OPD Visit API (/api/opd/visits/*). Endpoint names confirmed against apps/opd/views.py. */
import { hmsDelete, hmsGet, hmsPatch, hmsPost, type Paginated } from "./hmsClient";
import type {
  OPDStats,
  SetFollowUpPayload,
  VisitCreatePayload,
  VisitDetail,
  VisitListItem,
  VisitQueue,
} from "../../types/opd";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface VisitListParams {
  search?: string;
  status?: string;
  visit_type?: string;
  priority?: string;
  payment_status?: string;
  doctor?: number;
  patient?: number;
  visit_date__gte?: string;
  visit_date__lte?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export function listVisits(params?: VisitListParams) {
  return hmsGet<Paginated<VisitListItem>>("/opd/visits", {
    params: { page_size: 50, ...params },
  });
}

export function getVisit(id: number) {
  return hmsGet<VisitDetail>(`/opd/visits/${id}`);
}

export function createVisit(payload: VisitCreatePayload) {
  return hmsPost<VisitDetail>("/opd/visits", payload);
}

export function updateVisit(id: number, payload: Partial<VisitCreatePayload>) {
  return hmsPatch<VisitDetail>(`/opd/visits/${id}`, payload);
}

export function deleteVisit(id: number) {
  return hmsDelete(`/opd/visits/${id}`);
}

export function getVisitStatistics(params?: { date_from?: string; date_to?: string }) {
  return hmsGet<{ success: boolean; data: OPDStats }>("/opd/visits/statistics", { params }).then(
    (r) => r.data
  );
}

export function getTodayVisits() {
  return hmsGet<{ success: boolean; count: number; data: VisitListItem[] }>(
    "/opd/visits/today"
  ).then((r) => r.data);
}

export function getQueue(doctor?: "me") {
  return hmsGet<Envelope<VisitQueue>>("/opd/visits/queue", {
    params: doctor ? { doctor } : undefined,
  }).then((r) => r.data);
}

export function callNext(doctorId?: number) {
  return hmsPost<Envelope<VisitDetail>>("/opd/visits/call_next", undefined, {
    params: doctorId ? { doctor_id: doctorId } : undefined,
  });
}

export function startVisit(id: number) {
  return hmsPost<Envelope<VisitDetail>>(`/opd/visits/${id}/start`);
}

export function completeVisit(
  id: number,
  payload?: { diagnosis?: string; follow_up_date?: string; notes?: string }
) {
  return hmsPost<Envelope<VisitDetail>>(`/opd/visits/${id}/complete`, payload);
}

export function setFollowUp(id: number, payload: SetFollowUpPayload) {
  return hmsPost<Envelope<VisitDetail>>(`/opd/visits/${id}/set_follow_up`, payload);
}
