/**
 * superadmin's tenant-settings endpoint (admin.celiyo.com) — used only to
 * derive whether WhatsApp is configured (settings.whatsapp_vendor_uid +
 * whatsapp_api_token both present) and, when it is, to resolve those two
 * values so whatsapp.ts can attach them as request headers for digicrm.
 * Same bearer JWT as everywhere else in the app (superadmin issues it).
 */
import axios from "axios";
import { AUTH_BASE_URL } from "../config";
import { getAuthRuntime } from "../auth/authRuntime";

const adminClient = axios.create({
  baseURL: `${AUTH_BASE_URL}/api`,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

adminClient.interceptors.request.use((config) => {
  const token = getAuthRuntime().getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  if (config.url && !config.url.endsWith("/")) config.url += "/";
  return config;
});

export interface TenantSettings {
  whatsapp_vendor_uid?: string;
  whatsapp_api_token?: string;
  whatsapp_api_base_url?: string;
  [key: string]: unknown;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  enabled_modules: string[];
  settings: TenantSettings;
}

export async function getTenantMe(): Promise<Tenant> {
  const { data } = await adminClient.get<Tenant>("/tenants/me");
  return data;
}
