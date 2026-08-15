/**
 * Ported verbatim from celiyohms/src/features/clinical/lib/visibility.ts —
 * pure logic, no DOM dependency, evaluates identically on RN.
 */
import type { VisibilityRule } from "../../../types/clinical";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function evaluateCondition(
  condition: Record<string, unknown>,
  values: Record<string, unknown> | undefined
): boolean {
  const field = String(condition.field ?? "");
  const op = String(condition.op ?? "eq");
  const current = values?.[field];
  const expected = condition.value;

  if (op === "empty") return isEmpty(current);
  if (op === "notempty") return !isEmpty(current);
  if (op === "eq") return String(current ?? "") === String(expected ?? "");
  if (op === "neq") return String(current ?? "") !== String(expected ?? "");
  if (op === "in") {
    if (Array.isArray(current)) {
      return current
        .map(String)
        .some((item) => Array.isArray(expected) && expected.map(String).includes(item));
    }
    return Array.isArray(expected) && expected.map(String).includes(String(current ?? ""));
  }
  if (op === "gt") return Number(current) > Number(expected);
  if (op === "lt") return Number(current) < Number(expected);
  return true;
}

export function evaluateVisibility(
  rule: VisibilityRule | unknown,
  values: Record<string, unknown> | undefined
): boolean {
  if (!rule || !isPlainObject(rule) || Object.keys(rule).length === 0) return true;
  if (Array.isArray(rule.all)) return rule.all.every((r) => evaluateVisibility(r, values));
  if (Array.isArray(rule.any)) return rule.any.some((r) => evaluateVisibility(r, values));
  if ("not" in rule) return !evaluateVisibility(rule.not, values);
  if ("field" in rule) return evaluateCondition(rule, values);
  return true;
}

export function readVisibilityRule(
  config: Record<string, unknown> | undefined,
  explicit?: VisibilityRule
): VisibilityRule | unknown {
  return explicit ?? config?.visibility_rule;
}
