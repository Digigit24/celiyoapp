import type { ThemeConfig, ThemeMode } from "./types";

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: "system",
};

/**
 * Secure-store key for the user's theme preference. Tokens live in secure-store
 * too, so reusing the same backend means the same `expo-secure-store` reset
 * (sign-out) will also clear the theme preference.
 */
export const THEME_STORAGE_KEY = "celiyo.theme.config";

export const SUPPORTED_MODES: ThemeMode[] = ["light", "dark", "system"];
