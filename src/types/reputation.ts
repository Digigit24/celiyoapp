/**
 * Types for dghms's Google Business Profile (GMB) reputation module
 * (/api/reputation/*). Mirrors apps/reputation/models.py + serializers.py in
 * the dghms repo exactly (read directly from source, not just
 * docs/GMB_INTEGRATION.md, to pin down field names the doc left as prose —
 * e.g. GmbQuestion.text not question_text, GmbReview.rating not star_rating).
 *
 * Mobile is read-only + the low-risk Q&A "answer" action (POST .../answer/,
 * ungated unlike reviews/posts) — no OAuth connect, no listing edit, no
 * review reply composer, no Local Posts here. Those stay web-only.
 */

export type GmbConnectionStatus = "active" | "error" | "revoked";

export interface GmbConnection {
  id: number;
  tenant_id: string;
  google_account_id: string;
  google_account_name: string;
  status: GmbConnectionStatus;
  last_sync_at: string | null;
  last_error: string;
  location_count: number;
  created_at: string;
}

export type GmbVerificationState = "unverified" | "pending" | "verified";

/** GmbLocationListSerializer — the list endpoint's shape (locations/{id}/ retrieve returns more fields we don't need on mobile). */
export interface GmbLocationListItem {
  id: number;
  tenant_id: string;
  connection: number;
  google_location_id: string;
  title: string;
  internal_label: string;
  primary_category: string;
  phone_number: string;
  website_uri: string;
  verification_state: GmbVerificationState;
  is_active: boolean;
  maps_uri: string;
}

/** GmbLocationMetricsDailySerializer — one row per day. */
export interface GmbLocationMetricDay {
  date: string;
  views_maps: number;
  views_search: number;
  calls: number;
  direction_requests: number;
  website_clicks: number;
  bookings: number;
  conversations: number;
}

/** ScoreSignal.to_dict() (apps/reputation/services/optimization_score.py). */
export interface GmbScoreSignal {
  key: string;
  label: string;
  max_points: number;
  earned_points: number;
  recommendation: string;
}

/** ScoreResult.to_dict(), plus the optional AI fields added when ?explain=ai is passed (not used by mobile v1). */
export interface GmbScore {
  score: number;
  signals: GmbScoreSignal[];
  ai_recommendations?: string[];
  ai_error?: string | null;
}

export type GmbAnswerAuthorType = "owner" | "other";

/** GmbAnswerSerializer. */
export interface GmbAnswer {
  id: number;
  text: string;
  author_type: GmbAnswerAuthorType;
  create_time: string | null;
  answered_by_user_id: string | null;
  posted_to_google: boolean;
}

/** GmbQuestionSerializer. */
export interface GmbQuestion {
  id: number;
  tenant_id: string;
  location: number;
  text: string;
  author_display_name: string;
  upvote_count: number;
  create_time: string | null;
  is_answered: boolean;
  answers: GmbAnswer[];
}

export type GmbReviewReplyStatus = "none" | "ai_drafted" | "posted";
export type GmbReviewSentiment = "positive" | "neutral" | "negative" | "";

/** GmbReviewSerializer. */
export interface GmbReview {
  id: number;
  tenant_id: string;
  location: number;
  reviewer_display_name: string;
  reviewer_photo_url: string;
  rating: number; // 1-5
  comment: string;
  create_time: string | null;
  update_time: string | null;
  reply_text: string;
  reply_update_time: string | null;
  reply_status: GmbReviewReplyStatus;
  ai_draft_text: string;
  sentiment: GmbReviewSentiment;
}
