/**
 * Payments hooks — TanStack Query wrappers around `lib/api/payments`'s
 * module-wide CRUD (`listPayments`/`getPayment`/`getPaymentStats`/
 * `createPayment`/`updatePayment`/`deletePayment`), following the same
 * query-key-factory + `useSignedIn()` gate pattern as `features/opd/hooks.ts`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/payments";
import { useAuth } from "../../store/AuthContext";
import type {
  PaymentCreatePayload,
  PaymentListParams,
  PaymentStatsParams,
  PaymentUpdatePayload,
} from "../../types/payments";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const paymentKeys = {
  list: (params?: PaymentListParams) => ["payments", "list", params ?? {}] as const,
  detail: (id: string) => ["payments", "detail", id] as const,
  stats: (params?: PaymentStatsParams) => ["payments", "stats", params ?? {}] as const,
};

export function usePaymentsList(params?: PaymentListParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => api.listPayments(params),
    enabled,
  });
}

export function usePayment(id: string | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: paymentKeys.detail(id ?? ""),
    queryFn: () => api.getPayment(id as string),
    enabled,
  });
}

export function usePaymentStats(params?: PaymentStatsParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: paymentKeys.stats(params),
    queryFn: () => api.getPaymentStats(params),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentCreatePayload) => api.createPayment(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", "list"] });
      qc.invalidateQueries({ queryKey: ["payments", "stats"] });
    },
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PaymentUpdatePayload }) =>
      api.updatePayment(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: paymentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["payments", "list"] });
      qc.invalidateQueries({ queryKey: ["payments", "stats"] });
    },
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", "list"] });
      qc.invalidateQueries({ queryKey: ["payments", "stats"] });
    },
  });
}
