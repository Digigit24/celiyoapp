/**
 * digicrm WhatsApp integration (crm.celiyo.com). Same bearer JWT as dghms
 * plus per-tenant WA vendor credentials (X-WA-Vendor-Uid/X-WA-Api-Token),
 * resolved from superadmin's tenant settings and cached in memory for 5
 * minutes (mirroring celiyohms's server-side proxy cache) — never persisted
 * to disk. There is no BFF here (celiyohms keeps these headers server-side;
 * this app has "no BFF, no new backend" per CLAUDE.md), so the vendor token
 * is resolved and attached client-side for the lifetime of the request only.
 */
import axios from "axios";
import { CRM_BASE_URL } from "../config";
import { getAuthRuntime } from "../auth/authRuntime";
import { getTenantMe } from "./tenant";
import type { ChatHistoryResponse, ChatMessage, SendTextResult } from "../../types/whatsapp";

const crmClient = axios.create({
  baseURL: `${CRM_BASE_URL}/api`,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

interface WaCredentials {
  vendorUid: string;
  apiToken: string;
}

let credentialsCache: { value: WaCredentials | null; expiresAt: number } | null = null;
const CREDENTIALS_TTL_MS = 5 * 60_000;

async function resolveWaCredentials(): Promise<WaCredentials | null> {
  if (credentialsCache && credentialsCache.expiresAt > Date.now()) {
    return credentialsCache.value;
  }
  const tenant = await getTenantMe();
  const vendorUid = tenant.settings?.whatsapp_vendor_uid;
  const apiToken = tenant.settings?.whatsapp_api_token;
  const value = vendorUid && apiToken ? { vendorUid, apiToken } : null;
  credentialsCache = { value, expiresAt: Date.now() + CREDENTIALS_TTL_MS };
  return value;
}

crmClient.interceptors.request.use(async (config) => {
  const token = getAuthRuntime().getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  const creds = await resolveWaCredentials();
  if (creds) {
    config.headers.set("X-WA-Vendor-Uid", creds.vendorUid);
    config.headers.set("X-WA-Api-Token", creds.apiToken);
  }
  if (config.url && !config.url.endsWith("/")) config.url += "/";
  return config;
});

export function normalizeChatMessages(res: ChatHistoryResponse): ChatMessage[] {
  return res.messages ?? res.data ?? [];
}

export function isReplyWindowOpen(res: ChatHistoryResponse): boolean {
  return Boolean(res.reply_window_open ?? res.contact?.reply_window_open ?? false);
}

export async function getChatHistory(phone: string, page = 1, perPage = 50) {
  const { data } = await crmClient.get<ChatHistoryResponse>("/whatsapp/contacts/by-phone/chat", {
    params: { phone, page, per_page: perPage },
  });
  return data;
}

export async function sendWhatsAppText(phone: string, text: string, name?: string) {
  const { data } = await crmClient.post<SendTextResult>("/whatsapp/contacts/by-phone/send_text", {
    phone,
    text,
    ...(name ? { name } : {}),
  });
  return data;
}

/** Invalidate the cached vendor credentials — call after tenant settings might have changed. */
export function clearWaCredentialsCache() {
  credentialsCache = null;
}
