import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, EmptyState, SearchHeader, FilterBar } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  CATEGORY_CHIP_VARIANT,
  CATEGORY_FILTER_OPTIONS,
  CATEGORY_LABELS,
  formatDate,
  isExpired,
  isExpiringSoon,
  isLowStock,
  type InventoryItem,
  type ItemCategory,
} from "../constants";
import { useInventoryList } from "../hooks";

/**
 * Param list for the future Inventory stack. The orchestrator owns the
 * actual stack registration; exporting the type here keeps the contract typed.
 */
export type InventoryStackParamList = {
  InventoryList: undefined;
  InventoryDetail: { itemId: string };
};

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryList">;

const CATEGORY_ICON: Record<ItemCategory, keyof typeof Ionicons.glyphMap> = {
  medicine: "medical-outline",
  consumable: "layers-outline",
  equipment: "hardware-chip-outline",
};

function InventoryRow({
  item,
  onPress,
}: {
  item: InventoryItem;
  onPress: () => void;
}) {
  const lowStock = isLowStock(item);
  const expiringSoon = isExpiringSoon(item.expiryDate);
  const expired = isExpired(item.expiryDate);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open inventory item ${item.name}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name={CATEGORY_ICON[item.category]} size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground flex-1"
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Chip
              label={CATEGORY_LABELS[item.category]}
              variant={CATEGORY_CHIP_VARIANT[item.category]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {item.currentStock.toLocaleString("en-IN")} {item.unit} in stock
            {item.expiryDate ? ` · Exp ${formatDate(item.expiryDate)}` : ""}
          </Text>
          <View className="flex-row items-center gap-1.5">
            {lowStock ? <Chip label="Low stock" variant="warning" /> : null}
            {expired ? (
              <Chip label="Expired" variant="danger" />
            ) : expiringSoon ? (
              <Chip label="Expiring soon" variant="danger" />
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function InventoryListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ItemCategory>("all");

  const { data, totalCount } = useInventoryList({ search: query, category });

  const headerSubtitle = useMemo(() => {
    if (query.length === 0 && category === "all") {
      return `${data.length} of ${totalCount} items`;
    }
    return `${data.length} match${data.length === 1 ? "" : "es"}`;
  }, [data.length, query.length, category, totalCount]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search item, ref, batch, or supplier"
      />
      <FilterBar
        options={CATEGORY_FILTER_OPTIONS}
        value={category}
        onChange={(id) => setCategory(id as "all" | ItemCategory)}
      />

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
          gap: 10,
        }}
        ListHeaderComponent={
          <View className="flex-row items-center justify-between pb-2">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Stock items
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <InventoryRow
            item={item}
            onPress={() => navigation.navigate("InventoryDetail", { itemId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title="No items found"
            message={
              query.length > 0
                ? "Try a different search or category filter."
                : "Stock items will appear here."
            }
          />
        }
      />
    </View>
  );
}
