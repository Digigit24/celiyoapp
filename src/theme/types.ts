/**
 * Theme contract — mirrors the celiyohms web app's `src/features/theme/types.ts`
 * shape so the design tokens stay aligned. Mobile Phase 1 only owns `mode`;
 * the other fields are reserved for future phases (primary colour, density,
 * font family) and included here so consumers can read a single config shape.
 */
export type ThemeMode = "light" | "dark" | "system";

export interface ThemeConfig {
  /** User's preference; `system` follows Appearance.getColorScheme() live. */
  mode: ThemeMode;
}

/**
 * Public hook surface. `mode` is the user's preference; `resolved` is what the
 * UI should actually render right now (`system` collapses to the OS scheme).
 */
export interface UseTheme {
  config: ThemeConfig;
  mode: ThemeMode;
  resolved: "light" | "dark";
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  reset: () => void;
}
