/**
 * Backend endpoints.
 * - SuperAdmin (admin.celiyo.com): auth/JWT issuance — login, refresh, logout.
 * - dghms (hms.celiyo.com): the HMS API of record.
 * Both confirmed live: admin.celiyo.com/api/auth/login/ validates credentials,
 * hms.celiyo.com/api/* returns 401 without a bearer token.
 * (celiyohms's fallback default "api.celiyo.com" is a stale Cloudflare 530.)
 */
export const AUTH_BASE_URL = "https://admin.celiyo.com";
export const HMS_BASE_URL = "https://hms.celiyo.com";
/** digicrm — WhatsApp chat/send, gated behind the tenant's whatsapp_vendor_uid/whatsapp_api_token. */
export const CRM_BASE_URL = "https://crm.celiyo.com";
/**
 * AI Assistant (@digitech/hermes-chat-native's backend) — a Next.js app
 * hosting @digitech/hermes-chat's route handlers (chat/history/copilots/
 * conversations), same contract as the web widget. NOT yet a public
 * deployment: currently the local dev machine's network address, reachable
 * from a device/emulator on the same network (or Tailscale). Update this
 * once the assistant backend has a real deployed URL.
 */
export const ASSISTANT_BASE_URL = "http://192.168.1.2:3001";

export const AUTH_ENDPOINTS = {
  login: "/api/auth/login/",
  refresh: "/api/auth/token/refresh/",
  logout: "/api/auth/logout/",
} as const;

/** Refresh the access token this long before its `exp` (ms). */
export const REFRESH_AHEAD_MS = 60_000;
