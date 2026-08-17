/**
 * Pharmacy hooks.
 *
 * __demo: true — for the Phase 3 demo these return the static fixtures from
 * `constants.ts`. The shape is the same one the future API will return, so the
 * screens don't need to change when the live endpoint lands. Each hook just
 * swaps to a `useQuery({ queryFn: ... })` against `lib/api/pharmacy`.
 *
 * Filter / search are applied client-side over the demo data. The real API
 * will take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import {
  DEMO_PHARMACY_ORDERS,
  type DispensingStatus,
  type PharmacyOrder,
} from "./constants";

export interface UsePharmacyListParams {
  /** Free-text search across patient name, order ref, and doctor. */
  search?: string;
  /** Filter by dispensing status. `all` (or undefined) returns everything. */
  status?: "all" | DispensingStatus;
}

export interface UsePharmacyListResult {
  data: PharmacyOrder[];
  isLoading: boolean;
  isError: boolean;
  /** Total dataset size before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function usePharmacyList(
  params: UsePharmacyListParams = {}
): UsePharmacyListResult {
  const { search, status = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_PHARMACY_ORDERS.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (q.length === 0) return true;
      return (
        order.patientName.toLowerCase().includes(q) ||
        order.orderRef.toLowerCase().includes(q) ||
        order.patientId.toLowerCase().includes(q) ||
        order.prescribingDoctor.toLowerCase().includes(q)
      );
    });
  }, [search, status]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_PHARMACY_ORDERS.length,
  };
}

/**
 * Look up a single dispensing order by id. Receives the same shape the API
 * will return — the future implementation will read `/pharmacy/orders/{id}`.
 */
export function usePharmacyOrder(id: string | null | undefined): {
  data: PharmacyOrder | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_PHARMACY_ORDERS.find((order) => order.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
