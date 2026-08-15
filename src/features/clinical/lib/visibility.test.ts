import { evaluateVisibility } from "./visibility";

describe("evaluateVisibility", () => {
  it("is visible when the rule is empty/missing", () => {
    expect(evaluateVisibility(undefined, {})).toBe(true);
    expect(evaluateVisibility({}, {})).toBe(true);
    expect(evaluateVisibility(null, {})).toBe(true);
  });

  it("evaluates eq/neq", () => {
    const values = { gender: "female" };
    expect(evaluateVisibility({ field: "gender", op: "eq", value: "female" }, values)).toBe(true);
    expect(evaluateVisibility({ field: "gender", op: "eq", value: "male" }, values)).toBe(false);
    expect(evaluateVisibility({ field: "gender", op: "neq", value: "male" }, values)).toBe(true);
  });

  it("evaluates empty/notempty", () => {
    expect(evaluateVisibility({ field: "notes", op: "empty" }, { notes: "" })).toBe(true);
    expect(evaluateVisibility({ field: "notes", op: "empty" }, { notes: "x" })).toBe(false);
    expect(evaluateVisibility({ field: "notes", op: "notempty" }, { notes: "x" })).toBe(true);
    expect(evaluateVisibility({ field: "notes", op: "empty" }, { notes: [] })).toBe(true);
  });

  it("evaluates in for scalar and array current values", () => {
    expect(
      evaluateVisibility({ field: "role", op: "in", value: ["a", "b"] }, { role: "a" })
    ).toBe(true);
    expect(
      evaluateVisibility({ field: "roles", op: "in", value: ["a", "b"] }, { roles: ["b", "c"] })
    ).toBe(true);
    expect(
      evaluateVisibility({ field: "roles", op: "in", value: ["a", "b"] }, { roles: ["c"] })
    ).toBe(false);
  });

  it("evaluates gt/lt numerically", () => {
    expect(evaluateVisibility({ field: "age", op: "gt", value: 18 }, { age: 20 })).toBe(true);
    expect(evaluateVisibility({ field: "age", op: "lt", value: 18 }, { age: 20 })).toBe(false);
  });

  it("evaluates all/any/not composition", () => {
    const values = { a: "1", b: "2" };
    expect(
      evaluateVisibility(
        { all: [{ field: "a", op: "eq", value: "1" }, { field: "b", op: "eq", value: "2" }] },
        values
      )
    ).toBe(true);
    expect(
      evaluateVisibility(
        { all: [{ field: "a", op: "eq", value: "1" }, { field: "b", op: "eq", value: "x" }] },
        values
      )
    ).toBe(false);
    expect(
      evaluateVisibility(
        { any: [{ field: "a", op: "eq", value: "x" }, { field: "b", op: "eq", value: "2" }] },
        values
      )
    ).toBe(true);
    expect(
      evaluateVisibility({ not: { field: "a", op: "eq", value: "1" } }, values)
    ).toBe(false);
  });
});
