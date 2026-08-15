import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useNativeColorScheme } from "react-native";
import { useColorScheme as useNativewindColorScheme } from "nativewind";
import { DEFAULT_THEME_CONFIG } from "./constants";
import { loadThemeConfig, saveThemeConfig } from "./storage";
import type { ThemeConfig, ThemeMode, UseTheme } from "./types";

const ThemeContext = createContext<UseTheme | null>(null);

function resolve(mode: ThemeMode, system: "light" | "dark" | null | undefined): "light" | "dark" {
  if (mode === "system") return system === "dark" ? "dark" : "light";
  return mode;
}

/**
 * Owns the theme for the whole tree. Hydrates from secure-store once on mount,
 * then stays in sync with the OS via Appearance.addChangeListener. Writes go
 * to secure-store + NativeWind's class-based dark mode in a single batch, so a
 * toggle never shows the old colour for a frame.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with the in-memory default so the first paint never flashes a
  // different colour. The real config lands during the first effect below.
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  const systemScheme = useNativeColorScheme();
  const { setColorScheme } = useNativewindColorScheme();

  // Hydrate from secure-store once. Subsequent state lives in memory; writes
  // go back to storage on every setMode call.
  useEffect(() => {
    let cancelled = false;
    void loadThemeConfig().then((loaded) => {
      if (cancelled) return;
      setConfig(loaded);
      setHydrated(true);
      // Push the hydrated value into NativeWind so the class is on the root
      // before any screen subscribes.
      setColorScheme(loaded.mode === "system" ? "system" : loaded.mode);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply `mode` whenever the user changes it OR the system flips (so "system"
  // stays accurate when the user toggles their phone's appearance).
  useEffect(() => {
    if (!hydrated) return;
    setColorScheme(config.mode === "system" ? "system" : config.mode);
    void saveThemeConfig(config);
  }, [config, hydrated]);

  const setMode = useCallback((mode: ThemeMode) => {
    setConfig((prev) => (prev.mode === mode ? prev : { ...prev, mode }));
  }, []);

  const reset = useCallback(() => {
    setConfig(DEFAULT_THEME_CONFIG);
  }, []);

  const resolved = resolve(config.mode, systemScheme);
  const isDark = resolved === "dark";

  const value = useMemo<UseTheme>(
    () => ({ config, mode: config.mode, resolved, isDark, setMode, reset }),
    [config, resolved, isDark, setMode, reset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): UseTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Read just the resolved scheme (light/dark) — for components that don't need
 * the full hook surface. Re-renders when Appearance changes.
 */
export function useResolvedColorScheme(): "light" | "dark" {
  const { resolved } = useTheme();
  return resolved;
}
