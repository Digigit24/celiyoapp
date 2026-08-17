/**
 * Admin (staff administration) hooks — backed by the real superadmin
 * `/api/users/` + `/api/roles/` endpoints (`src/lib/api/adminUsers.ts`).
 *
 * The real ViewSets take no search/filter query params server-side, so
 * `useStaffList`/`useRoles` fetch everything and the screens filter
 * client-side (search box, status chips) — same pattern the old demo module
 * used over its fixtures, just pointed at live data now.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../store/AuthContext";
import * as api from "../../lib/api/adminUsers";
import type {
  RoleCreatePayload,
  RoleUpdatePayload,
  StaffCreatePayload,
  StaffUpdatePayload,
} from "../../types/admin";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const adminKeys = {
  staffList: () => ["admin", "staff", "list"] as const,
  staffDetail: (id: string) => ["admin", "staff", "detail", id] as const,
  roles: () => ["admin", "roles", "list"] as const,
};

export function useStaffList() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: adminKeys.staffList(), queryFn: api.listStaff, enabled });
}

export function useStaffMember(id: string | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: adminKeys.staffDetail(id ?? ""),
    queryFn: () => api.getStaff(id as string),
    enabled,
  });
}

export function useRoles() {
  const enabled = useSignedIn();
  return useQuery({ queryKey: adminKeys.roles(), queryFn: api.listRoles, enabled });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StaffCreatePayload) => api.createStaff(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.staffList() }),
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StaffUpdatePayload }) => api.updateStaff(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: adminKeys.staffList() });
      qc.invalidateQueries({ queryKey: adminKeys.staffDetail(id) });
    },
  });
}

/** Thin wrapper over `useUpdateStaff` for the primary "remove access" action — `PATCH {is_active}`, no hard delete. */
export function useDeactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateStaff(id, { is_active: isActive }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: adminKeys.staffList() });
      qc.invalidateQueries({ queryKey: adminKeys.staffDetail(id) });
    },
  });
}

/** Real hard delete — no server-side safety net. Screens should gate this behind a strong confirmation. */
export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteStaff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.staffList() }),
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoleCreatePayload) => api.createRole(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.roles() }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoleUpdatePayload }) => api.updateRole(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.roles() }),
  });
}

/** No member-count guard server-side — same confirmation caution as `useDeleteStaff`. */
export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.roles() }),
  });
}
