import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../lib/api/inventory";
import { useAuth } from "../../store/AuthContext";
import type {
  AdjustStockPayload,
  InventoryItemCreatePayload,
  InventoryItemUpdatePayload,
  IssueStockPayload,
  ReceiveStockPayload,
} from "../../types/inventory";

function useSignedIn(): boolean {
  return useAuth().status === "signedIn";
}

export const inventoryKeys = {
  list: (params?: api.InventoryItemListParams) => ["inventory", "items", "list", params ?? {}] as const,
  lowStock: () => ["inventory", "items", "low-stock"] as const,
  expiringSoon: (days: number) => ["inventory", "items", "expiring-soon", days] as const,
  detail: (id: number) => ["inventory", "items", "detail", id] as const,
  batches: (itemId: number) => ["inventory", "items", itemId, "batches"] as const,
  stockHistory: (itemId: number) => ["inventory", "items", itemId, "stock-history"] as const,
  alerts: (params?: { is_acknowledged?: boolean }) => ["inventory", "alerts", params ?? {}] as const,
};

export function useInventoryItems(params?: api.InventoryItemListParams) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => api.listInventoryItems(params),
    enabled,
  });
}

export function useLowStockItems(enabled: boolean) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => api.listLowStockItems(),
    enabled: signedIn && enabled,
  });
}

export function useExpiringSoonItems(days: number, enabled: boolean) {
  const signedIn = useSignedIn();
  return useQuery({
    queryKey: inventoryKeys.expiringSoon(days),
    queryFn: () => api.listExpiringSoonItems(days),
    enabled: signedIn && enabled,
  });
}

export function useInventoryItem(id: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(id);
  return useQuery({
    queryKey: inventoryKeys.detail(id ?? 0),
    queryFn: () => api.getInventoryItem(id as number),
    enabled,
  });
}

export function useItemBatches(itemId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(itemId);
  return useQuery({
    queryKey: inventoryKeys.batches(itemId ?? 0),
    queryFn: () => api.listItemBatches(itemId as number).then((r) => r.results),
    enabled,
  });
}

export function useStockHistory(itemId: number | null | undefined) {
  const enabled = useSignedIn() && Boolean(itemId);
  return useQuery({
    queryKey: inventoryKeys.stockHistory(itemId ?? 0),
    queryFn: () => api.getStockHistory(itemId as number),
    enabled,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryItemCreatePayload) => api.createInventoryItem(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "items"] }),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InventoryItemUpdatePayload }) =>
      api.updateInventoryItem(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["inventory", "items", "list"] });
      qc.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
    },
  });
}

/** Soft-removal — the only "delete" exposed in the UI (real DELETE 500s once an item has history). */
export function useDeactivateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deactivateInventoryItem(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      qc.invalidateQueries({ queryKey: ["inventory", "items", "list"] });
    },
  });
}

function invalidateAfterStockChange(qc: ReturnType<typeof useQueryClient>, itemId: number) {
  qc.invalidateQueries({ queryKey: inventoryKeys.detail(itemId) });
  qc.invalidateQueries({ queryKey: inventoryKeys.batches(itemId) });
  qc.invalidateQueries({ queryKey: inventoryKeys.stockHistory(itemId) });
  qc.invalidateQueries({ queryKey: ["inventory", "items", "list"] });
  qc.invalidateQueries({ queryKey: inventoryKeys.lowStock() });
}

export function useReceiveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReceiveStockPayload) => api.receiveStock(payload),
    onSuccess: (_data, payload) => invalidateAfterStockChange(qc, payload.item),
  });
}

export function useIssueStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: IssueStockPayload) => api.issueStock(payload),
    onSuccess: (_data, payload) => invalidateAfterStockChange(qc, payload.item),
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustStockPayload) => api.adjustStock(payload),
    onSuccess: (_data, payload) => invalidateAfterStockChange(qc, payload.item),
  });
}

export function useAlerts(params?: { is_acknowledged?: boolean }) {
  const enabled = useSignedIn();
  return useQuery({
    queryKey: inventoryKeys.alerts(params),
    queryFn: () => api.listAlerts(params),
    enabled,
  });
}

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.acknowledgeAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "alerts"] }),
  });
}
