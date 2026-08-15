import * as SecureStore from "expo-secure-store";
import { DEFAULT_THEME_CONFIG, THEME_STORAGE_KEY } from "./constants";
import type { ThemeConfig, ThemeMode } from "./types";

const SUPPORTED: ThemeMode[] = ["light", "dark", "system"];

function isMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && (SUPPORTED as string[]).includes(value);
}

function sanitize(raw: unknown): ThemeConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_THEME_CONFIG;
  const obj = raw as { mode?: unknown };
  return {
    mode: isMode(obj.mode) ? obj.mode : DEFAULT_THEME_CONFIG.mode,
  };
}

/**
 * Read the user's persisted theme config. Returns the default if nothing has
 * been stored yet or the stored payload is unrecognisable (e.g. a stale shape
 * from an older app version). `expo-secure-store` failures are non-fatal —
 * worst case the user gets the default until next launch.
 */
export async function loadThemeConfig(): Promise<ThemeConfig> {
  try {
    const raw = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CONFIG;
    return sanitize(JSON.parse(raw));
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}

/**
 * Persist the theme config. Writes are awaited so callers can chain on
 * confirmation — important when toggling quickly, because two writes that
 * race could leave the last write being the wrong value.
 */
export async function saveThemeConfig(config: ThemeConfig): Promise<void> {
  try {
    await SecureStore.setItemAsync(
      THEME_STORAGE_KEY,
      JSON.stringify(sanitize(config))
    );
  } catch {
    // Non-fatal — the in-memory config still drives this session.
  }
}
