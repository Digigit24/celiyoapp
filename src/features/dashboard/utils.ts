/** Date-range, formatting and delta helpers shared across dashboard widgets. */

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type RangeKey = "today" | "week" | "month";

export interface DateRange {
  key: RangeKey;
  label: string;
  date_from: string;
  date_to: string;
}

/** Build a date range from a fixed "now" so the caller controls the clock (no Date.now() surprises in tests). */
export function buildRange(key: RangeKey, now: Date = new Date()): DateRange {
  const to = toISODate(now);
  if (key === "today") {
    return { key, label: "Today", date_from: to, date_to: to };
  }
  const from = new Date(now);
  if (key === "week") {
    from.setDate(from.getDate() - 6);
    return { key, label: "7 days", date_from: toISODate(from), date_to: to };
  }
  from.setDate(from.getDate() - 29);
  return { key, label: "30 days", date_from: toISODate(from), date_to: to };
}

export const RANGE_OPTIONS: RangeKey[] = ["today", "week", "month"];

/** The equal-length window immediately preceding `range`, for a delta comparison. */
export function priorRange(range: DateRange): { date_from: string; date_to: string } {
  const from = new Date(range.date_from);
  const to = new Date(range.date_to);
  const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const priorTo = new Date(from);
  priorTo.setDate(priorTo.getDate() - 1);
  const priorFrom = new Date(priorTo);
  priorFrom.setDate(priorFrom.getDate() - (spanDays - 1));
  return { date_from: toISODate(priorFrom), date_to: toISODate(priorTo) };
}

export function computeDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function formatCurrency(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (!Number.isFinite(n)) return "₹0";
  if (Math.abs(n) >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function formatCompactNumber(value: number | null | undefined): string {
  const n = value ?? 0;
  if (Math.abs(n) >= 100_000) return `${(n / 100_000).toFixed(1)}L`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}
