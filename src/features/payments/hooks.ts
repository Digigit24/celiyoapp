/**
 * Payments hooks.
 *
 * __demo: true — for the Phase 3 demo these return the static fixtures from
 * `constants.ts`. The shape is the same one the future API will return, so the
 * screens don't need to change when the live endpoint lands. Each hook just
 * swaps to a `useQuery({ queryFn: ... })` against `lib/api/payments`.
 *
 * Filter / search are applied client-side over the demo data. The real API
 * will take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import {
  DEMO_PAYMENTS,
  type PaymentStatus,
  type PaymentTransaction,
} from "./constants";

export interface UsePaymentsListParams {
  /** Free-text search across patient name, ref, and transaction ID. */
  search?: string;
  /** Filter by status. `all` (or undefined) returns everything. */
  status?: "all" | PaymentStatus;
}

export interface UsePaymentsListResult {
  data: PaymentTransaction[];
  isLoading: boolean;
  isError: boolean;
  /** Subset of the dataset before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function usePaymentsList(
  params: UsePaymentsListParams = {}
): UsePaymentsListResult {
  const { search, status = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_PAYMENTS.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (q.length === 0) return true;
      return (
        p.patientName.toLowerCase().includes(q) ||
        p.transactionRef.toLowerCase().includes(q) ||
        p.relatedRef.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q)
      );
    });
  }, [search, status]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_PAYMENTS.length,
  };
}

/**
 * Look up a single transaction by id. Receives the same shape the API will
 * return — the future implementation will read `/payments/{id}`.
 */
export function usePayment(id: string | null | undefined): {
  data: PaymentTransaction | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_PAYMENTS.find((p) => p.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
