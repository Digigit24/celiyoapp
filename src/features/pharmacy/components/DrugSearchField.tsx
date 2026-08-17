/**
 * Debounced search-and-pick against `/inventory/items` — modeled on IPD
 * billing's CatalogSearchField. Renders results as a plain mapped list (not
 * a FlatList): always lives inside an outer form ScrollView and results are
 * already capped to 15 rows by the API call, so there's nothing to
 * virtualize (see the "List rendering rule" in CLAUDE.md).
 *
 * `PrescriptionItem.inventory_item` references `apps.inventory.InventoryItem`
 * — a different table than `src/hooks/masters.ts`'s `PharmacyProduct` sale
 * catalog — so this searches the real Inventory module's items instead.
 */
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { searchInventoryItems } from "../../../lib/api/inventory";
import type { InventoryItem } from "../../../types/inventory";

interface DrugSearchFieldProps {
  onPick: (item: InventoryItem) => void;
}

export function DrugSearchField({ onPick }: DrugSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  function handleQueryChange(text: string) {
    setQuery(text);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchInventoryItems(text.trim()));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }

  return (
    <View className="gap-1">
      <TextInput
        value={query}
        onChangeText={handleQueryChange}
        onFocus={() => setOpen(true)}
        placeholder="Search inventory items…"
        placeholderTextColor="#94a3b8"
        className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
      />
      {open && (loading || results.length > 0) ? (
        <View className="rounded-lg border border-border bg-popover overflow-hidden">
          {loading ? (
            <View className="p-3">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  onPick(item);
                  setQuery("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex-row items-center justify-between px-3 py-2.5 border-b border-border active:bg-accent"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-sm text-popover-foreground" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {item.current_stock} {item.unit_of_measure} in stock
                    {item.is_out_of_stock ? " · Out of stock" : item.is_low_stock ? " · Low stock" : ""}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}
