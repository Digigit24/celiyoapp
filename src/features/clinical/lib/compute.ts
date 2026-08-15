/**
 * Ported verbatim from celiyohms/src/features/clinical/components/
 * ClinicalFormRenderer.tsx's safeCompute — regex-guarded arithmetic eval for
 * `calculated` fields. Works the same under Hermes (no DOM dependency).
 */
import type { ClinicalFormField } from "../../../types/clinical";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function safeCompute(
  field: ClinicalFormField,
  values: Record<string, unknown> | undefined
): string {
  const compute = field.config?.compute;
  if (!isPlainObject(compute) || typeof compute.formula !== "string") return "";
  const inputs = Array.isArray(compute.inputs) ? compute.inputs.map(String) : [];
  if (inputs.length === 0) return "";
  const scope = new Map(inputs.map((key) => [key, Number(values?.[key])]));
  if ([...scope.values()].some((v) => Number.isNaN(v))) return "";
  const expression = compute.formula.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (token) => {
    if (!scope.has(token)) return "0";
    return String(scope.get(token));
  });
  if (!/^[\d+\-*/().\s]+$/.test(expression)) return "";
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${expression});`)();
    if (typeof result !== "number" || !Number.isFinite(result)) return "";
    const round = typeof compute.round === "number" ? compute.round : 2;
    return String(Number(result.toFixed(round)));
  } catch {
    return "";
  }
}
