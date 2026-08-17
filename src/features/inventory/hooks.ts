/**
 * Inventory hooks.
 *
 * __demo: true — for the Phase 3 demo these return the static fixtures from
 * `constants.ts`. The shape is the same one the future API will return, so
 * the screens don't need to change when the live endpoint lands. Each hook
 * just swaps to a `useQuery({ queryFn: ... })` against `lib/api/inventory`.
 *
 * Filter / search are applied client-side over the demo data. The real API
 * will take these as query params, but the input contract stays identical.
 */
import { useMemo } from "react";
import { DEMO_INVENTORY_ITEMS, type InventoryItem, type ItemCategory } from "./constants";

export interface UseInventoryListParams {
  /** Free-text search across item name, ref, and supplier. */
  search?: string;
  /** Filter by category. `all` (or undefined) returns everything. */
  category?: "all" | ItemCategory;
}

export interface UseInventoryListResult {
  data: InventoryItem[];
  isLoading: boolean;
  isError: boolean;
  /** Total dataset size before filtering — useful for "showing X of Y". */
  totalCount: number;
}

export function useInventoryList(
  params: UseInventoryListParams = {}
): UseInventoryListResult {
  const { search, category = "all" } = params;

  const filtered = useMemo(() => {
    const q = search?.trim().toLowerCase() ?? "";
    return DEMO_INVENTORY_ITEMS.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (q.length === 0) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.itemRef.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.batchNo.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  return {
    data: filtered,
    isLoading: false,
    isError: false,
    totalCount: DEMO_INVENTORY_ITEMS.length,
  };
}

/**
 * Look up a single inventory item by id. Receives the same shape the API
 * will return — the future implementation will read `/inventory/items/{id}`.
 */
export function useInventoryItem(id: string | null | undefined): {
  data: InventoryItem | null;
  isLoading: boolean;
  isError: boolean;
} {
  const data = useMemo(() => {
    if (!id) return null;
    return DEMO_INVENTORY_ITEMS.find((item) => item.id === id) ?? null;
  }, [id]);

  return { data, isLoading: false, isError: false };
}
