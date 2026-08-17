/**
 * dghms Inventory API (/api/inventory/*). Endpoint names/shapes confirmed
 * against apps/inventory source — see src/types/inventory.ts for field-level
 * caveats (esp. InventoryBatch/StockAlert, whose exact serializer fields
 * aren't fully enumerated in the verified contract).
 */
import { hmsDelete, hmsGet, hmsPatch, hmsPost, type Paginated } from "./hmsClient";
import type {
  AdjustStockPayload,
  InventoryBatch,
  InventoryItem,
  InventoryItemCreatePayload,
  InventoryItemDetail,
  InventoryItemUpdatePayload,
  InventoryTag,
  IssueStockPayload,
  ReceiveStockPayload,
  StockAlert,
  StockTransaction,
} from "../../types/inventory";

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface InventoryItemListParams {
  search?: string;
  category?: number;
  is_active?: boolean;
  /** Comma-separated, AND-matched. */
  tags?: string;
  ordering?: "name" | "-name" | "current_stock" | "-current_stock" | "created_at" | "-created_at";
  page?: number;
  page_size?: number;
}

export function listInventoryItems(params?: InventoryItemListParams) {
  return hmsGet<Paginated<InventoryItem>>("/inventory/items", {
    params: { page_size: 20, ordering: "name", ...params },
  });
}

export function getInventoryItem(id: number) {
  return hmsGet<InventoryItemDetail>(`/inventory/items/${id}`);
}

export function createInventoryItem(payload: InventoryItemCreatePayload) {
  return hmsPost<InventoryItemDetail>("/inventory/items", payload);
}

/** PATCH only — the ViewSet's http_method_names excludes PUT. */
export function updateInventoryItem(id: number, payload: InventoryItemUpdatePayload) {
  return hmsPatch<InventoryItemDetail>(`/inventory/items/${id}`, payload);
}

/** Soft-removal — the only one exposed in the UI. Real DELETE 500s once the item has transaction history. */
export function deactivateInventoryItem(id: number) {
  return hmsPatch<InventoryItemDetail>(`/inventory/items/${id}`, { is_active: false });
}

export function listLowStockItems(params?: { page?: number; page_size?: number }) {
  return hmsGet<Paginated<InventoryItem>>("/inventory/items/low-stock", {
    params: { page_size: 20, ...params },
  });
}

export function listExpiringSoonItems(days = 30, params?: { page?: number; page_size?: number }) {
  return hmsGet<Paginated<InventoryItem>>("/inventory/items/expiring-soon", {
    params: { days, page_size: 20, ...params },
  });
}

export function getStockHistory(itemId: number, params?: { page?: number; page_size?: number }) {
  return hmsGet<Paginated<StockTransaction>>(`/inventory/items/${itemId}/stock-history`, {
    params: { page_size: 20, ...params },
  });
}

export function listItemBatches(itemId: number) {
  return hmsGet<Paginated<InventoryBatch>>("/inventory/batches", {
    params: { item: itemId, page_size: 50 },
  });
}

/** Soft-removal for batches too — orphans instead of a clean DELETE error. */
export function deactivateBatch(id: number) {
  return hmsPatch<InventoryBatch>(`/inventory/batches/${id}`, { is_active: false });
}

export function receiveStock(payload: ReceiveStockPayload) {
  return hmsPost<Envelope<StockTransaction>>("/inventory/stock-transactions/receive", payload);
}

export function issueStock(payload: IssueStockPayload) {
  return hmsPost<Envelope<StockTransaction>>("/inventory/stock-transactions/issue", payload);
}

export function adjustStock(payload: AdjustStockPayload) {
  return hmsPost<Envelope<StockTransaction>>("/inventory/stock-transactions/adjust", payload);
}

export function listAlerts(params?: { is_acknowledged?: boolean; page?: number; page_size?: number }) {
  return hmsGet<Paginated<StockAlert>>("/inventory/alerts", {
    params: { page_size: 20, ...params },
  });
}

export function acknowledgeAlert(id: number) {
  return hmsPost<Envelope<StockAlert>>(`/inventory/alerts/${id}/acknowledge`, {});
}

/**
 * Lightweight search-and-pick used by Pharmacy's add-drug-item picker (a
 * different table than PharmacyProduct — `PrescriptionItem.inventory_item`
 * references `apps.inventory.InventoryItem`). Reuses this module's own list
 * call rather than duplicating a bespoke endpoint.
 */
export function searchInventoryItems(query: string) {
  return listInventoryItems({ search: query, is_active: true, page_size: 15 }).then(
    (r) => r.results
  );
}

export type { InventoryTag };
