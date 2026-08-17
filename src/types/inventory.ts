/**
 * dghms Inventory API types (/api/inventory/items|batches|stock-transactions|alerts).
 *
 * A real, separate, more complete system than the pharmacy sale catalog
 * (`src/hooks/masters.ts`'s `PharmacyProduct`): multi-category via `tags`,
 * real batch/expiry tracking, and a real stock-transaction ledger.
 *
 * Confirmed against dghms source (apps/inventory):
 * - `current_stock` is always server-derived — never settable on create/update.
 * - No `batch_no`/`supplier`/`expiry_date` directly on the item; those live on
 *   `InventoryBatch`, fetched separately via `?item={id}`.
 * - Item/batch `DELETE` is technically live but 500s (uncaught ProtectedError)
 *   once there's transaction history — deactivate (`PATCH {is_active:false}`)
 *   is the only removal action exposed in this UI.
 */

export const INVENTORY_TAGS = [
  "opd",
  "ipd",
  "general",
  "pharmacy",
  "surgical",
  "lab",
  "other",
] as const;
export type InventoryTag = (typeof INVENTORY_TAGS)[number];

export interface InventoryItem {
  id: number;
  name: string;
  code: string | null;
  barcode: string | null;
  category: number | null;
  category_name: string | null;
  tags: InventoryTag[];
  unit_of_measure: string;
  purchase_price: string;
  selling_price: string;
  reorder_level: number;
  max_stock_level: number | null;
  expiry_alert_days: number;
  current_stock: number;
  is_active: boolean;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  is_overstock: boolean;
  created_at: string;
}

/** Detail adds these on top of the list fields above. */
export interface InventoryItemDetail extends InventoryItem {
  tax_rate: string;
  hsn_code: string | null;
  description: string;
  created_by_user_id: string | null;
  updated_at: string;
}

/** `POST /inventory/items` — only `name` is required. `current_stock` is never settable. */
export interface InventoryItemCreatePayload {
  name: string;
  code?: string;
  barcode?: string;
  category?: number;
  tags?: InventoryTag[];
  unit_of_measure?: string;
  purchase_price?: string | number;
  selling_price?: string | number;
  reorder_level?: number;
  max_stock_level?: number;
  expiry_alert_days?: number;
  tax_rate?: string | number;
  hsn_code?: string;
  description?: string;
}

/** `PATCH /inventory/items/{id}` — no PUT (http_method_names excludes it). */
export type InventoryItemUpdatePayload = Partial<InventoryItemCreatePayload> & {
  is_active?: boolean;
};

/**
 * Field list isn't fully enumerated in the verified contract (only that
 * batch/expiry/supplier data lives here, fetched via `?item={id}`) — inferred
 * from the `receive` payload shape, which is confirmed. Flagged in case the
 * live serializer differs; the UI only reads fields it also writes.
 */
export interface InventoryBatch {
  id: number;
  item: number;
  batch_number: string;
  quantity: number;
  expiry_date: string | null;
  manufacturing_date: string | null;
  supplier: string | null;
  unit_cost: string | null;
  is_active: boolean;
  created_at: string;
}

export const STOCK_ADJUSTMENT_TYPES = [
  "adjustment_add",
  "adjustment_remove",
  "disposal",
  "expired",
] as const;
export type StockAdjustmentType = (typeof STOCK_ADJUSTMENT_TYPES)[number];

export const STOCK_ISSUE_TYPES = ["issue_opd", "issue_ipd", "issue_general"] as const;
export type StockIssueType = (typeof STOCK_ISSUE_TYPES)[number];

export const STOCK_REFERENCE_TYPES = ["opd_visit", "ipd_admission", "manual", "other"] as const;
export type StockReferenceType = (typeof STOCK_REFERENCE_TYPES)[number];

/** `POST /inventory/stock-transactions/receive` — adds stock + optionally a new batch. */
export interface ReceiveStockPayload {
  item: number;
  batch_number: string;
  quantity: number;
  expiry_date?: string;
  manufacturing_date?: string;
  supplier?: string;
  unit_cost?: string | number;
  reference_id?: string;
  notes?: string;
}

/** `POST /inventory/stock-transactions/issue` */
export interface IssueStockPayload {
  item: number;
  quantity: number;
  batch?: number;
  issue_type?: StockIssueType;
  reference_type?: StockReferenceType;
  reference_id?: string;
  notes?: string;
}

/** `POST /inventory/stock-transactions/adjust` — `adjustment_type` is required, no default. */
export interface AdjustStockPayload {
  item: number;
  adjustment_type: StockAdjustmentType;
  quantity: number;
  batch?: number;
  notes?: string;
}

export interface StockTransaction {
  id: number;
  item: number;
  item_name: string;
  item_unit: string;
  batch: number | null;
  batch_number: string | null;
  transaction_type: string;
  transaction_type_label: string;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  unit_cost: string | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  is_addition: boolean;
  performed_by_user_id: string | null;
  created_at: string;
}

export type StockAlertType =
  | "low_stock"
  | "out_of_stock"
  | "expiry_approaching"
  | "expired"
  | "overstock";

/**
 * Field list similarly inferred (contract only confirms the resource, its
 * five `alert_type` values, and the acknowledge action) — mirrors the shape
 * of every other list resource in this contract (id + display fields +
 * timestamps) plus the acknowledge flag the UI needs to gate the button.
 */
export interface StockAlert {
  id: number;
  item: number;
  item_name: string;
  alert_type: StockAlertType;
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}
