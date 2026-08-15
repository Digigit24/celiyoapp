import { safeCompute } from "./compute";
import type { ClinicalFormField } from "../../../types/clinical";

function calcField(config: Record<string, unknown>): ClinicalFormField {
  return {
    id: 1,
    tenant_id: "t",
    section: 1,
    field_key: "bmi",
    field_type: "calculated",
    label: "BMI",
    help_text: "",
    display_order: 0,
    is_required: false,
    is_read_only: true,
    default_value: null,
    config,
    picklist: null,
    is_active: true,
    created_at: "",
    updated_at: "",
    created_by_user_id: null,
  };
}

describe("safeCompute", () => {
  it("computes a rounded arithmetic result from named inputs", () => {
    const field = calcField({ compute: { formula: "weight / (height * height)", inputs: ["weight", "height"], round: 1 } });
    expect(safeCompute(field, { weight: 70, height: 1.75 })).toBe("22.9");
  });

  it("returns empty string when an input is missing/non-numeric", () => {
    const field = calcField({ compute: { formula: "a + b", inputs: ["a", "b"] } });
    expect(safeCompute(field, { a: 1 })).toBe("");
    expect(safeCompute(field, { a: "x", b: 2 })).toBe("");
  });

  it("rejects formulas containing non-arithmetic tokens after substitution", () => {
    const field = calcField({ compute: { formula: "a; process.exit()", inputs: ["a"] } });
    expect(safeCompute(field, { a: 1 })).toBe("");
  });

  it("returns empty string when compute config is missing", () => {
    const field = calcField({});
    expect(safeCompute(field, { a: 1 })).toBe("");
  });
});
