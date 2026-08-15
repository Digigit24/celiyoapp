import React from "react";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "./ThemeProvider";

/**
 * Mount-once component that translates the resolved theme into the visual
 * surfaces the rest of the app depends on:
 *
 *  - StatusBar: light content for dark backgrounds, dark content for light.
 *  - NavigationContainer's theme: derived from useTheme().isDark so the
 *    stack/drawer headers inherit colours from CSS vars (no hard-coded
 *    hex). Callers pass `<NavigationContainer theme={navTheme(isDark)}>`.
 *
 * The component returns null — it exists purely to trigger its `useTheme`
 * subscription at the top of the tree.
 */
export function ThemeModeSync() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}
