import {
  buildInitialValues,
  fieldValueToValue,
  mapFieldToUpsertItem,
} from "./fieldMapping";
import type { ClinicalFieldValue, ClinicalFormField } from "../../../types/clinical";

function field(overrides: Partial<ClinicalFormField>): ClinicalFormField {
  return {
    id: 1,
    tenant_id: "t",
    section: 1,
    field_key: "k",
    field_type: "text",
    label: "K",
    help_text: "",
    display_order: 0,
    is_required: false,
    is_read_only: false,
    default_value: null,
    config: {},
    picklist: null,
    is_active: true,
    created_at: "",
    updated_at: "",
    created_by_user_id: null,
    ...overrides,
  };
}

describe("fieldValueToValue", () => {
  const base: ClinicalFieldValue = {
    id: 1,
    tenant_id: "t",
    record: 1,
    field: 1,
    field_key: "k",
    field_type: "text",
    value_text: null,
    value_number: null,
    value_boolean: null,
    value_date: null,
    value_json: null,
    is_active: true,
    created_at: "",
    updated_at: "",
    created_by_user_id: null,
  };

  it("prefers value_json over everything else", () => {
    expect(fieldValueToValue({ ...base, value_json: [1, 2], value_text: "x" })).toEqual([1, 2]);
  });

  it("falls through in priority order when value_json is absent", () => {
    expect(fieldValueToValue({ ...base, value_datetime: "2026-01-01T00:00:00Z" })).toBe(
      "2026-01-01T00:00:00Z"
    );
    expect(fieldValueToValue({ ...base, value_time: "10:00" })).toBe("10:00");
    expect(fieldValueToValue({ ...base, value_text: "hello" })).toBe("hello");
    expect(fieldValueToValue({ ...base, value_number: "5" })).toBe("5");
    expect(fieldValueToValue({ ...base, value_boolean: true })).toBe(true);
    expect(fieldValueToValue({ ...base, value_date: "2026-01-01" })).toBe("2026-01-01");
  });

  it("defaults to empty string when nothing is set", () => {
    expect(fieldValueToValue(base)).toBe("");
  });
});

describe("buildInitialValues", () => {
  function fv(overrides: Partial<ClinicalFieldValue>): ClinicalFieldValue {
    return {
      id: 1,
      tenant_id: "t",
      record: 1,
      field: 1,
      field_key: "k",
      field_type: "text",
      value_text: null,
      value_number: null,
      value_boolean: null,
      value_date: null,
      value_json: null,
      is_active: true,
      created_at: "",
      updated_at: "",
      created_by_user_id: null,
      ...overrides,
    };
  }

  it("keys values by field_key", () => {
    const record = {
      field_values: [
        fv({ field_key: "name", value_text: "Alice" }),
        fv({ field_key: "age", value_number: "30" }),
      ],
    };
    expect(buildInitialValues(record)).toEqual({ name: "Alice", age: "30" });
  });

  it("returns an empty object for a null/undefined record", () => {
    expect(buildInitialValues(null)).toEqual({});
    expect(buildInitialValues(undefined)).toEqual({});
  });
});

describe("mapFieldToUpsertItem", () => {
  it("skips undefined/empty-string values", () => {
    expect(mapFieldToUpsertItem(field({}), undefined)).toBeNull();
    expect(mapFieldToUpsertItem(field({}), "")).toBeNull();
  });

  it("serializes grid/multiselect as value_json", () => {
    const rows = [{ medicine: "Paracetamol" }];
    expect(mapFieldToUpsertItem(field({ id: 5, field_type: "grid" }), rows)).toEqual({
      field_id: 5,
      value_json: rows,
    });
    expect(
      mapFieldToUpsertItem(field({ id: 6, field_type: "multiselect" }), ["a", "b"])
    ).toEqual({ field_id: 6, value_json: ["a", "b"] });
  });

  it("serializes number/boolean/date/datetime/time to their typed columns", () => {
    expect(mapFieldToUpsertItem(field({ id: 1, field_type: "number" }), 42)).toEqual({
      field_id: 1,
      value_text: "42",
      value_number: 42,
    });
    expect(mapFieldToUpsertItem(field({ id: 2, field_type: "boolean" }), true)).toEqual({
      field_id: 2,
      value_boolean: true,
      value_text: "true",
    });
    expect(mapFieldToUpsertItem(field({ id: 3, field_type: "date" }), "2026-01-01")).toEqual({
      field_id: 3,
      value_date: "2026-01-01",
      value_text: "2026-01-01",
    });
  });

  it("serializes plain arrays/objects on other field types as value_json, not [object Object]", () => {
    expect(
      mapFieldToUpsertItem(field({ id: 7, field_type: "body_diagram" }), [{ x: 1, y: 2 }])
    ).toEqual({ field_id: 7, value_json: [{ x: 1, y: 2 }] });
  });

  it("falls back to value_text for plain scalars", () => {
    expect(mapFieldToUpsertItem(field({ id: 8, field_type: "text" }), "hello")).toEqual({
      field_id: 8,
      value_text: "hello",
    });
  });
});
