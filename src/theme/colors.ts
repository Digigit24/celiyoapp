/**
 * Theme tokens ported from celiyohms/src/styles/globals.css.
 * Hex values match the web app's light/dark palettes exactly
 * (shadcn neutral base + Celiyo brand overrides).
 */

export const lightColors = {
  background: "#ffffff",
  foreground: "#0f172a",
  "foreground-secondary": "#475569",
  surface: "#f8fafc",
  "surface-elevated": "#ffffff",
  card: "#ffffff",
  "card-foreground": "#0f172a",
  popover: "#ffffff",
  "popover-foreground": "#0f172a",
  primary: "#2563eb",
  "primary-foreground": "#ffffff",
  secondary: "#f1f5f9",
  "secondary-foreground": "#0f172a",
  muted: "#f1f5f9",
  "muted-foreground": "#64748b",
  accent: "#f1f5f9",
  "accent-foreground": "#0f172a",
  destructive: "#ef4444",
  "destructive-foreground": "#ffffff",
  border: "#e2e8f0",
  input: "#e2e8f0",
  ring: "#2563eb",
  "chart-1": "#2563eb",
  "chart-2": "#64748b",
  "chart-3": "#6b7280",
  "chart-4": "#374151",
  "chart-5": "#0f172a",
  sidebar: "#f8fafc",
  "sidebar-foreground": "#0f172a",
  "sidebar-primary": "#2563eb",
  "sidebar-primary-foreground": "#ffffff",
  "sidebar-accent": "#f1f5f9",
  "sidebar-accent-foreground": "#0f172a",
  "sidebar-border": "#e2e8f0",
  "sidebar-ring": "#2563eb",
} as const;

export const darkColors = {
  background: "#0f172a",
  foreground: "#f8fafc",
  "foreground-secondary": "#cbd5e1",
  surface: "#1e293b",
  "surface-elevated": "#1e293b",
  card: "#0f172a",
  "card-foreground": "#f8fafc",
  popover: "#0f172a",
  "popover-foreground": "#f8fafc",
  primary: "#3b82f6",
  "primary-foreground": "#0f172a",
  secondary: "#1e293b",
  "secondary-foreground": "#f8fafc",
  muted: "#1e293b",
  "muted-foreground": "#94a3b8",
  accent: "#1e293b",
  "accent-foreground": "#f8fafc",
  destructive: "#7c1d1d",
  "destructive-foreground": "#f8fafc",
  border: "#1e293b",
  input: "#1e293b",
  ring: "#3b82f6",
  "chart-1": "#3b82f6",
  "chart-2": "#94a3b8",
  "chart-3": "#64748b",
  "chart-4": "#475569",
  "chart-5": "#f8fafc",
  sidebar: "#0f172a",
  "sidebar-foreground": "#f8fafc",
  "sidebar-primary": "#3b82f6",
  "sidebar-primary-foreground": "#0f172a",
  "sidebar-accent": "#1e293b",
  "sidebar-accent-foreground": "#f8fafc",
  "sidebar-border": "#1e293b",
  "sidebar-ring": "#3b82f6",
} as const;

/** Radius: 0.5rem base on a 14px web root ≈ 7px; sm/md derived at 0.6x/0.8x. */
export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 11,
  "2xl": 14,
  "3xl": 18,
  full: 9999,
} as const;

export type ThemeColors = typeof lightColors;

/**
 * Widened palette — `lightColors`/`darkColors` are `as const`, so their literal
 * hex types are mutually incompatible. Components that accept either scheme's
 * palette should annotate with this.
 */
export type Palette = { readonly [K in keyof ThemeColors]: string };
