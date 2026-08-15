import AsyncStorage from "@react-native-async-storage/async-storage";
import { ASSISTANT_BASE_URL as DEFAULT_ASSISTANT_BASE_URL } from "../../../lib/config";

const BASE_URL_OVERRIDE_KEY = "celiyoapp:settings:assistant-base-url";

export { DEFAULT_ASSISTANT_BASE_URL };

/** The effective assistant backend URL: a user-set override if one exists, else the built-in default. */
export async function getAssistantBaseUrl(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(BASE_URL_OVERRIDE_KEY);
    return stored && stored.trim() ? stored.trim() : DEFAULT_ASSISTANT_BASE_URL;
  } catch {
    return DEFAULT_ASSISTANT_BASE_URL;
  }
}

export async function setAssistantBaseUrlOverride(url: string): Promise<void> {
  await AsyncStorage.setItem(BASE_URL_OVERRIDE_KEY, url.trim().replace(/\/+$/, ""));
}

export async function clearAssistantBaseUrlOverride(): Promise<void> {
  await AsyncStorage.removeItem(BASE_URL_OVERRIDE_KEY);
}

export type AssistantBackendStatus = "checking" | "configured" | "unconfigured" | "unreachable";

function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timed out")), timeoutMs);
    fetch(url)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/** Checks whether the assistant backend at `baseUrl` is reachable and has completed admin setup. */
export async function checkAssistantBackendStatus(baseUrl: string): Promise<AssistantBackendStatus> {
  try {
    const res = await fetchWithTimeout(`${baseUrl.replace(/\/+$/, "")}/api/hermes-admin/bootstrap`, 6000);
    if (!res.ok) return "unreachable";
    const data = (await res.json()) as { bootstrapped?: boolean };
    return data.bootstrapped ? "configured" : "unconfigured";
  } catch {
    return "unreachable";
  }
}
