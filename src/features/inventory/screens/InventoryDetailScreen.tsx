import React, { useLayoutEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Card,
  Chip,
  KeyValueRow,
  SectionHeader,
  StatTile,
  TimelineRow,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  CATEGORY_CHIP_VARIANT,
  CATEGORY_LABELS,
  daysUntilExpiry,
  formatDate,
  formatINR,
  isExpired,
  isExpiringSoon,
  isLowStock,
  MOVEMENT_TYPE_ICON,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_TINT,
} from "../constants";
import { useInventoryItem } from "../hooks";
import type { InventoryStackParamList } from "./InventoryListScreen";

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryDetail">;

export function InventoryDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: item, isLoading } = useInventoryItem(itemId);

  useLayoutEffect(() => {
    if (item) {
      navigation.setOptions({
        title: item.itemRef,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={CATEGORY_LABELS[item.category]}
              variant={CATEGORY_CHIP_VARIANT[item.category]}
            />
          </View>
        ),
      });
    }
  }, [navigation, item]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">
          Item not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The item may have been removed. Try going back to the list.
        </Text>
      </View>
    );
  }

  const lowStock = isLowStock(item);
  const expiringSoon = isExpiringSoon(item.expiryDate);
  const expired = isExpired(item.expiryDate);
  const remainingDays = daysUntilExpiry(item.expiryDate);
  const stockValue = item.currentStock * item.unitCost;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Identity header */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={item.name} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {item.itemRef} · Batch {item.batchNo}
              </Text>
              <View className="flex-row flex-wrap items-center gap-1.5 pt-1">
                <Chip
                  label={CATEGORY_LABELS[item.category]}
                  variant={CATEGORY_CHIP_VARIANT[item.category]}
                />
                {lowStock ? <Chip label="Low stock" variant="warning" /> : null}
                {expired ? (
                  <Chip label="Expired" variant="danger" />
                ) : expiringSoon ? (
                  <Chip label="Expiring soon" variant="danger" />
                ) : null}
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow
              label="Current stock"
              value={`${item.currentStock.toLocaleString("en-IN")} ${item.unit}`}
            />
            {item.expiryDate ? (
              <KeyValueRow label="Expiry" value={formatDate(item.expiryDate)} />
            ) : null}
          </View>
        </Card>
      </View>

      {/* Quick stats */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile
              icon="cube-outline"
              label="Current stock"
              value={`${item.currentStock} ${item.unit}`}
              tint={lowStock ? "amber" : "blue"}
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="trending-down-outline"
              label="Reorder level"
              value={`${item.reorderLevel} ${item.unit}`}
              tint="slate"
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="pricetag-outline"
              label="Stock value"
              value={formatINR(stockValue)}
              tint="emerald"
              hint={`${formatINR(item.unitCost)} / ${item.unit.replace(/s$/, "")}`}
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="calendar-outline"
              label={item.expiryDate ? "Days to expiry" : "Expiry"}
              value={
                item.expiryDate
                  ? remainingDays !== null && remainingDays < 0
                    ? "Expired"
                    : String(remainingDays)
                  : "N/A"
              }
              tint={expired ? "rose" : expiringSoon ? "amber" : "slate"}
            />
          </View>
        </View>
      </View>

      {/* Stock info */}
      <View>
        <SectionHeader title="Stock info" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="Batch no." value={item.batchNo} />
              <KeyValueRow label="Supplier" value={item.supplier} />
              <KeyValueRow label="Reorder level" value={`${item.reorderLevel} ${item.unit}`} />
              <KeyValueRow label="Unit cost" value={formatINR(item.unitCost)} />
            </View>
          </Card>
        </View>
      </View>

      {/* Stock movement timeline */}
      <View>
        <SectionHeader
          title="Stock movements"
          count={`${item.movements.length} event${item.movements.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {item.movements.map((event, i) => (
                <TimelineRow
                  key={`${event.type}-${i}`}
                  title={`${MOVEMENT_TYPE_LABELS[event.type]} · ${event.qtyDelta > 0 ? "+" : ""}${event.qtyDelta} ${item.unit}`}
                  subtitle={[event.performedBy, event.note].filter(Boolean).join(" · ")}
                  when={event.when}
                  tint={MOVEMENT_TYPE_TINT[event.type]}
                  icon={MOVEMENT_TYPE_ICON[event.type]}
                  isLast={i === item.movements.length - 1}
                />
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* Phase 3 nudge — honest "coming soon" footer for live actions */}
      <View className="px-4">
        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-50">
              <Ionicons name="construct-outline" size={18} color="#92400e" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Live stock control arrives in Phase 3
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                Receiving, issuing, and adjustment actions ship with the
                Phase 3 inventory integration. Auth and permissions are
                already wired.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
