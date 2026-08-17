import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, EmptyState, SearchHeader, FilterBar } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import { LIST_VIEW_OPTIONS, TAG_LABELS, type ListView } from "../constants";
import { useExpiringSoonItems, useInventoryItems, useLowStockItems } from "../hooks";
import type { InventoryItem } from "../../../types/inventory";

/** Param list for the Inventory stack — the orchestrator (InventoryStack.tsx) owns registration. */
export type InventoryStackParamList = {
  InventoryList: undefined;
  InventoryDetail: { itemId: number };
  NewInventoryItem: undefined;
  EditInventoryItem: { itemId: number };
};

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryList">;

function InventoryRow({ item, onPress }: { item: InventoryItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open inventory item ${item.name}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="cube-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-semibold text-foreground flex-1" numberOfLines={1}>
              {item.name}
            </Text>
            {item.category_name ? <Chip label={item.category_name} variant="info" /> : null}
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {item.current_stock.toLocaleString("en-IN")} {item.unit_of_measure} in stock
            {item.code ? ` · ${item.code}` : ""}
          </Text>
          <View className="flex-row flex-wrap items-center gap-1.5">
            {!item.is_active ? <Chip label="Inactive" variant="neutral" /> : null}
            {item.is_out_of_stock ? (
              <Chip label="Out of stock" variant="danger" />
            ) : item.is_low_stock ? (
              <Chip label="Low stock" variant="warning" />
            ) : null}
            {item.is_overstock ? <Chip label="Overstock" variant="info" /> : null}
            {item.tags.slice(0, 2).map((t) => (
              <Chip key={t} label={TAG_LABELS[t]} variant="neutral" />
            ))}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function InventoryListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ListView>("all");

  const listQuery = useInventoryItems(
    view === "all" ? { search: query || undefined } : undefined
  );
  const lowStockQuery = useLowStockItems(view === "low_stock");
  const expiringQuery = useExpiringSoonItems(30, view === "expiring_soon");

  const active = view === "all" ? listQuery : view === "low_stock" ? lowStockQuery : expiringQuery;
  const results = active.data?.results ?? [];
  const isLoading = active.isLoading;
  const isError = active.isError;

  const headerSubtitle = useMemo(() => {
    if (!active.data) return "";
    return `${results.length} of ${active.data.count} item${active.data.count === 1 ? "" : "s"}`;
  }, [active.data, results.length]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search item name, code, or barcode"
        right={
          can("hms.inventory.manage_inventory") ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New inventory item"
              onPress={() => navigation.navigate("NewInventoryItem")}
              className="h-9 w-9 items-center justify-center rounded-full bg-primary active:opacity-80"
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </Pressable>
          ) : undefined
        }
      />
      <FilterBar options={LIST_VIEW_OPTIONS} value={view} onChange={(id) => setView(id as ListView)} />

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
            gap: 10,
          }}
          refreshing={active.isRefetching}
          onRefresh={active.refetch}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Stock items
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground/70">{headerSubtitle}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <InventoryRow item={item} onPress={() => navigation.navigate("InventoryDetail", { itemId: item.id })} />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Couldn't load items"
                message="Check your connection and try again."
                action={
                  <Pressable onPress={() => active.refetch()}>
                    <Text className="text-sm font-semibold text-primary">Retry</Text>
                  </Pressable>
                }
              />
            ) : (
              <EmptyState
                icon="cube-outline"
                title="No items found"
                message={
                  view !== "all"
                    ? "Nothing matches this filter right now."
                    : query.length > 0
                      ? "Try a different search."
                      : "Stock items will appear here."
                }
              />
            )
          }
        />
      )}
    </View>
  );
}
