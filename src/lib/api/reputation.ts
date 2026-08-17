/**
 * dghms Google Business Profile (GMB) reputation API (/api/reputation/*).
 * Mobile is read-only + the ungated Q&A "answer" action — see
 * docs/GMB_INTEGRATION.md in the dghms repo and, for the exact field/envelope
 * shapes below, apps/reputation/views.py + urls.py (read directly since the
 * doc only gives prose for reviews/questions payloads).
 *
 * Envelope split (confirmed against views.py):
 * - connections/locations/questions/reviews are plain
 *   ReadOnlyModelViewSets + TenantViewSetMixin → standard DRF list envelope
 *   {success,count,next,previous,results} (same `Paginated<T>` every other
 *   ViewSet list in this app uses).
 * - metrics/score/answer are custom @action endpoints built on
 *   common.responses.success_response → {success, data, message?}.
 */
import { hmsGet, hmsPost, type Paginated } from "./hmsClient";
import type {
  GmbConnection,
  GmbLocationListItem,
  GmbLocationMetricDay,
  GmbQuestion,
  GmbReview,
  GmbScore,
} from "../../types/reputation";

interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function listConnections() {
  return hmsGet<Paginated<GmbConnection>>("/reputation/connections").then((r) => r.results);
}

export function listLocations() {
  return hmsGet<Paginated<GmbLocationListItem>>("/reputation/locations").then((r) => r.results);
}

/** GET /locations/{id}/metrics/?days=N — daily rows, oldest→newest (view orders by date asc). */
export function getLocationMetrics(locationId: number, days = 7) {
  return hmsGet<Envelope<GmbLocationMetricDay[]>>(`/reputation/locations/${locationId}/metrics`, {
    params: { days },
  }).then((r) => r.data);
}

/** GET /locations/{id}/score/ — rule-based score + per-signal recommendations. AI narration (?explain=ai) isn't requested on mobile v1 to keep this a cheap, fast dashboard fetch. */
export function getLocationScore(locationId: number) {
  return hmsGet<Envelope<GmbScore>>(`/reputation/locations/${locationId}/score`).then((r) => r.data);
}

export interface QuestionListParams {
  location?: number;
  is_answered?: boolean;
}

export function listQuestions(params?: QuestionListParams) {
  return hmsGet<Paginated<GmbQuestion>>("/reputation/questions", { params }).then((r) => r.results);
}

/** POST /questions/{id}/answer/ — ungated (unlike reviews), posts to Google immediately. */
export function answerQuestion(questionId: number, text: string) {
  return hmsPost<Envelope<GmbQuestion>>(`/reputation/questions/${questionId}/answer`, { text }).then(
    (r) => r.data
  );
}

export interface ReviewListParams {
  location?: number;
  reply_status?: "none" | "ai_drafted" | "posted";
  rating?: number;
}

export function listReviews(params?: ReviewListParams) {
  return hmsGet<Paginated<GmbReview>>("/reputation/reviews", { params }).then((r) => r.results);
}
