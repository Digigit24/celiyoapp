/** Dashboard chart/semantic colors — same fixed light/dark pairs celiyohms uses, plus the theme's chart-1..5 series for anything tenant-branded. */
import { useTheme } from "../../theme/ThemeProvider";
import { darkColors, lightColors } from "../../theme/colors";

export interface DashboardPalette {
  primary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  ipd: string;
  neutral: string;
  series: string[];
  track: string;
  /** Diagonal hero-card gradient stops (violet → indigo), light/dark tuned. */
  hero: [string, string];
  heroText: string;
  heroTextMuted: string;
}

const LIGHT: DashboardPalette = {
  primary: "#2563eb",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#0ea5e9",
  ipd: "#7c3aed",
  neutral: "#64748b",
  series: ["#7c3aed", "#f97316", "#10b981", "#0ea5e9", "#f59e0b"],
  track: "#eef0f5",
  hero: ["#7c3aed", "#4f46e5"],
  heroText: "#ffffff",
  heroTextMuted: "rgba(255,255,255,0.78)",
};

const DARK: DashboardPalette = {
  primary: "#3b82f6",
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
  info: "#38bdf8",
  ipd: "#a78bfa",
  neutral: "#94a3b8",
  series: ["#a78bfa", "#fb923c", "#34d399", "#38bdf8", "#fbbf24"],
  track: "#263041",
  hero: ["#6d28d9", "#312e81"],
  heroText: "#ffffff",
  heroTextMuted: "rgba(255,255,255,0.72)",
};

export function useDashboardPalette(): DashboardPalette {
  const { isDark } = useTheme();
  return isDark ? DARK : LIGHT;
}

export function useThemeColors() {
  const { isDark } = useTheme();
  return isDark ? darkColors : lightColors;
}
