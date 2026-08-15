import {
  decodeJWT,
  getPrimaryRole,
  hasPermission,
  isGrant,
} from "./permissions";

describe("getPrimaryRole", () => {
  it("returns admin for super admins regardless of roles", () => {
    expect(getPrimaryRole(undefined, true)).toBe("admin");
    expect(getPrimaryRole(["nurse"], true)).toBe("admin");
  });

  it("normalizes admin-ish role names to admin", () => {
    expect(getPrimaryRole(["Admin"])).toBe("admin");
    expect(getPrimaryRole(["superadmin"])).toBe("admin");
    expect(getPrimaryRole(["hospital_admin"])).toBe("admin");
    expect(getPrimaryRole(["HospitalAdmin"])).toBe("admin");
  });

  it("picks the first matching role in priority order", () => {
    expect(getPrimaryRole(["cashier", "doctor"])).toBe("doctor");
    expect(getPrimaryRole(["staff", "nurse"])).toBe("nurse");
    expect(getPrimaryRole(["pharmacist"])).toBe("pharmacist");
    expect(getPrimaryRole(["lab_technician"])).toBe("lab_technician");
  });

  it("is case-insensitive", () => {
    expect(getPrimaryRole(["Doctor"])).toBe("doctor");
    expect(getPrimaryRole(["NURSE"])).toBe("nurse");
  });

  it("returns null when no known role matches", () => {
    expect(getPrimaryRole([])).toBeNull();
    expect(getPrimaryRole(["unknown_role"])).toBeNull();
    expect(getPrimaryRole(undefined)).toBeNull();
  });
});

describe("isGrant", () => {
  it("treats true, own, all as grants", () => {
    expect(isGrant(true)).toBe(true);
    expect(isGrant("own")).toBe(true);
    expect(isGrant("all")).toBe(true);
  });

  it("treats legacy team as a grant", () => {
    expect(isGrant("team")).toBe(true);
  });

  it("treats legacy {enabled:true} as a grant", () => {
    expect(isGrant({ enabled: true })).toBe(true);
  });

  it("rejects false-y and unknown shapes", () => {
    expect(isGrant(false)).toBe(false);
    expect(isGrant(undefined)).toBe(false);
    expect(isGrant(null)).toBe(false);
    expect(isGrant("none")).toBe(false);
    expect(isGrant("false")).toBe(false);
    expect(isGrant({ enabled: false })).toBe(false);
    expect(isGrant({})).toBe(false);
    expect(isGrant(0)).toBe(false);
  });
});

describe("hasPermission", () => {
  it("super admin bypasses all checks", () => {
    expect(hasPermission(undefined, "hms.opd.view", true)).toBe(true);
    expect(hasPermission({}, "anything.at.all", true)).toBe(true);
  });

  it("denies when permissions are missing", () => {
    expect(hasPermission(undefined, "hms.opd.view")).toBe(false);
    expect(hasPermission({}, "hms.opd.view")).toBe(false);
  });

  it("grants flat keys with true / own / all / team / {enabled:true}", () => {
    expect(hasPermission({ "hms.opd.view": true }, "hms.opd.view")).toBe(true);
    expect(hasPermission({ "hms.opd.view": "own" }, "hms.opd.view")).toBe(true);
    expect(hasPermission({ "hms.opd.view": "all" }, "hms.opd.view")).toBe(true);
    expect(hasPermission({ "hms.opd.view": "team" }, "hms.opd.view")).toBe(
      true
    );
    expect(
      hasPermission({ "hms.opd.view": { enabled: true } }, "hms.opd.view")
    ).toBe(true);
  });

  it("denies explicit non-grant values", () => {
    expect(hasPermission({ "hms.opd.view": false }, "hms.opd.view")).toBe(
      false
    );
    expect(
      hasPermission({ "hms.opd.view": { enabled: false } }, "hms.opd.view")
    ).toBe(false);
  });

  it("resolves nested permission objects via dot path", () => {
    const nested = { hms: { patients: { view: "all" } } };
    expect(hasPermission(nested, "hms.patients.view")).toBe(true);
    expect(hasPermission(nested, "hms.patients.edit")).toBe(false);
    expect(hasPermission(nested, "hms.opd.view")).toBe(false);
  });

  it("prefers flat key over nested path when both exist", () => {
    const both = {
      "hms.opd.view": false,
      hms: { opd: { view: true } },
    };
    expect(hasPermission(both, "hms.opd.view")).toBe(false);
  });

  it("admin.full_access.enabled wildcard grants admin.* and hms.* checks", () => {
    const perms = { "admin.full_access.enabled": true };
    expect(hasPermission(perms, "hms.pharmacy.view")).toBe(true);
    expect(hasPermission(perms, "admin.users.delete")).toBe(true);
  });

  it("wildcard does not grant non-admin/hms namespaces", () => {
    const perms = { "admin.full_access.enabled": true };
    expect(hasPermission(perms, "crm.leads.view")).toBe(false);
  });

  it("wildcard respects non-grant values", () => {
    expect(
      hasPermission(
        { "admin.full_access.enabled": false },
        "hms.pharmacy.view"
      )
    ).toBe(false);
  });
});

describe("decodeJWT", () => {
  function makeToken(payload: object): string {
    const b64 = Buffer.from(JSON.stringify(payload), "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `header.${b64}.signature`;
  }

  it("decodes a JWT payload without atob", () => {
    const payload = {
      user_id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      email: "doctor@example.com",
      tenant_id: "tenant-1",
      is_super_admin: false,
      permissions: { "hms.opd.view": "all" },
      roles: ["doctor"],
      exp: 1893456000,
    };
    expect(decodeJWT(makeToken(payload))).toEqual(payload);
  });

  it("handles non-ASCII characters (UTF-8)", () => {
    const payload = { name: "Dr. Ångström — 日本語", exp: 1 };
    const decoded = decodeJWT(makeToken(payload)) as unknown as typeof payload;
    expect(decoded.name).toBe(payload.name);
  });

  it("throws on malformed tokens", () => {
    expect(() => decodeJWT("not-a-jwt")).toThrow("Invalid JWT token");
  });
});
