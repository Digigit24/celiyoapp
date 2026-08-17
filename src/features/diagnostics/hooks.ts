/**
 * Lab / Diagnostics hooks.
 *
 * __demo: true — for the Phase 3 demo these return the static fixtures from
 * `constants.ts`. The shape is the same one the future API will return, so
 * the screens don't need to change when the live endpoint lands. Each hook
 * just swaps to a `useQuery({ queryFn: ... })` against `lib/api/diagnostics`.
 *
 * Filter / search are applied client-side over the demo data. The real API
 * will take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import { DEMO_LAB_ORDERS, type LabOrder, type LabOrderStatus } from "./constants";

export interface UseLabOrdersListParams {
  /** Free-text search across patient name, order ref, panel, and doctor. */
  search?: string;
  /** Filter by order status. `all` (or undefined) returns everything. */
  status?: "all" | LabOrderStatus;
}

export interface UseLabOrdersListResult {
  data: LabOrder[];
  isLoading: boolean;
  isError: boolean;
  /** Total dataset size before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function useLabOrdersList(
  params: UseLabOrdersListParams = {}
): UseLabOrdersListResult {
  const { search, status = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_LAB_ORDERS.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (q.length === 0) return true;
      return (
        order.patientName.toLowerCase().includes(q) ||
        order.orderRef.toLowerCase().includes(q) ||
        order.patientId.toLowerCase().includes(q) ||
        order.orderingDoctor.toLowerCase().includes(q) ||
        order.panels.some((panel) => panel.toLowerCase().includes(q))
      );
    });
  }, [search, status]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_LAB_ORDERS.length,
  };
}

/**
 * Look up a single lab order by id. Receives the same shape the API will
 * return — the future implementation will read `/diagnostics/orders/{id}`.
 */
export function useLabOrder(id: string | null | undefined): {
  data: LabOrder | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_LAB_ORDERS.find((order) => order.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
