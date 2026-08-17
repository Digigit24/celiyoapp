/**
 * Admin (staff administration) hooks.
 *
 * __demo: true — for the Phase 3 demo these return the static fixtures from
 * `constants.ts`. The shape is the same one the future API will return, so
 * the screens don't need to change when the live endpoint lands. Each hook
 * just swaps to a `useQuery({ queryFn: ... })` against `lib/api/admin`.
 *
 * Filter / search are applied client-side over the demo data. The real API
 * will take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import { DEMO_STAFF, type StaffMember, type StaffStatus } from "./constants";

export interface UseStaffListParams {
  /** Free-text search across name, employee id, department, and email. */
  search?: string;
  /** Filter by status. `all` (or undefined) returns everything. */
  status?: "all" | StaffStatus;
}

export interface UseStaffListResult {
  data: StaffMember[];
  isLoading: boolean;
  isError: boolean;
  /** Total dataset size before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function useStaffList(params: UseStaffListParams = {}): UseStaffListResult {
  const { search, status = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_STAFF.filter((staff) => {
      if (status !== "all" && staff.status !== status) return false;
      if (q.length === 0) return true;
      return (
        staff.name.toLowerCase().includes(q) ||
        staff.employeeId.toLowerCase().includes(q) ||
        staff.department.toLowerCase().includes(q) ||
        staff.email.toLowerCase().includes(q)
      );
    });
  }, [search, status]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_STAFF.length,
  };
}

/**
 * Look up a single staff member by id. Receives the same shape the API will
 * return — the future implementation will read `/admin/staff/{id}`.
 */
export function useStaffMember(id: string | null | undefined): {
  data: StaffMember | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_STAFF.find((staff) => staff.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
