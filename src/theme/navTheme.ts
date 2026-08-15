import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";
import { darkColors, lightColors } from "./colors";

/**
 * Build the React Navigation Theme object from the resolved scheme. Callers
 * pass the result to `<NavigationContainer theme={...}>` so headers, focus
 * rings, and back-button tints all flip with the rest of the UI.
 */
export function buildNavTheme(isDark: boolean): Theme {
  const c = isDark ? darkColors : lightColors;
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: c.primary,
      background: c.background,
      card: c.card,
      text: c.foreground,
      border: c.border,
      notification: c.destructive,
    },
  };
}
