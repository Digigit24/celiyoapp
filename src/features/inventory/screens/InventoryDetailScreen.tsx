import React, { useLayoutEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  KeyValueRow,
  SectionHeader,
  StatTile,
  TimelineRow,
  useToast,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  TAG_LABELS,
  TRANSACTION_ICON,
  TRANSACTION_TINT,
  daysUntilExpiry,
  formatDate,
  formatDateTime,
  formatINR,
} from "../constants";
import { useDeactivateItem, useInventoryItem, useItemBatches, useStockHistory } from "../hooks";
import { StockActionsSheet, type StockActionKind } from "../components/StockActionsSheet";
import type { InventoryStackParamList } from "./InventoryListScreen";

type Props = NativeStackScreenProps<InventoryStackParamList, "InventoryDetail">;

function extractErrorMessage(err: unknown, fallback: string): string {
  const anyErr = err as { response?: { data?: { message?: string; detail?: string } } };
  return anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? fallback;
}

export function InventoryDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can } = useAuth();
  const canManage = can("hms.inventory.manage_inventory");

  const { data: item, isLoading, isError, refetch } = useInventoryItem(itemId);
  const { data: batches } = useItemBatches(itemId);
  const { data: history } = useStockHistory(itemId);
  const deactivateItem = useDeactivateItem();

  const [sheetKind, setSheetKind] = useState<StockActionKind | null>(null);

  useLayoutEffect(() => {
    if (item) {
      navigation.setOptions({
        title: item.code || `Item #${item.id}`,
        headerRight: () =>
          canManage ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit item"
              hitSlop={10}
              onPress={() => navigation.navigate("EditInventoryItem", { itemId: item.id })}
              className="pr-1"
            >
              <Ionicons name="create-outline" size={20} color="#2563eb" />
            </Pressable>
          ) : undefined,
      });
    }
  }, [navigation, item, canManage]);

  function handleDeactivate() {
    if (!item) return;
    Alert.alert(
      "Deactivate item?",
      "The item will be hidden from active stock lists. This can be reversed later by editing the item.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () =>
            deactivateItem.mutate(item.id, {
              onSuccess: () => toast.show("Item deactivated", "success"),
              onError: (err) => toast.show(extractErrorMessage(err, "Couldn't deactivate the item"), "error"),
            }),
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !item) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this item"
          message="It may have been removed, or your connection dropped."
          action={<Button title="Retry" onPress={() => refetch()} fullWidth={false} />}
        />
      </View>
    );
  }

  const stockValue = item.current_stock * Number(item.purchase_price || 0);
  const historyItems = history?.results ?? [];
  const batchList = batches ?? [];

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
                {item.code ?? "No code"} {item.category_name ? `· ${item.category_name}` : ""}
              </Text>
              <View className="flex-row flex-wrap items-center gap-1.5 pt-1">
                {!item.is_active ? <Chip label="Inactive" variant="neutral" /> : null}
                {item.is_out_of_stock ? (
                  <Chip label="Out of stock" variant="danger" />
                ) : item.is_low_stock ? (
                  <Chip label="Low stock" variant="warning" />
                ) : null}
                {item.is_overstock ? <Chip label="Overstock" variant="info" /> : null}
                {item.tags.map((t) => (
                  <Chip key={t} label={TAG_LABELS[t]} variant="neutral" />
                ))}
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow
              label="Current stock"
              value={`${item.current_stock.toLocaleString("en-IN")} ${item.unit_of_measure}`}
            />
            <KeyValueRow label="Reorder level" value={`${item.reorder_level} ${item.unit_of_measure}`} />
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
              value={`${item.current_stock} ${item.unit_of_measure}`}
              tint={item.is_low_stock ? "amber" : "blue"}
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="pricetag-outline"
              label="Stock value"
              value={formatINR(stockValue)}
              tint="emerald"
              hint={`${formatINR(item.purchase_price)} / ${item.unit_of_measure.replace(/s$/, "")}`}
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile icon="layers-outline" label="Batches" value={batchList.length} tint="slate" />
          </View>
          <View className="flex-1">
            <StatTile icon="swap-vertical-outline" label="Movements" value={history?.count ?? 0} tint="violet" />
          </View>
        </View>
      </View>

      {/* Stock actions */}
      {canManage ? (
        <View className="px-4 flex-row gap-2">
          <View className="flex-1">
            <Button title="Receive" size="sm" variant="outline" onPress={() => setSheetKind("receive")} />
          </View>
          <View className="flex-1">
            <Button title="Issue" size="sm" variant="outline" onPress={() => setSheetKind("issue")} />
          </View>
          <View className="flex-1">
            <Button title="Adjust" size="sm" variant="outline" onPress={() => setSheetKind("adjust")} />
          </View>
        </View>
      ) : null}

      {/* Item info */}
      <View>
        <SectionHeader title="Item info" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="Unit of measure" value={item.unit_of_measure} />
              <KeyValueRow label="Purchase price" value={formatINR(item.purchase_price)} />
              <KeyValueRow label="Selling price" value={formatINR(item.selling_price)} />
              <KeyValueRow label="Tax rate" value={`${item.tax_rate}%`} />
              {item.hsn_code ? <KeyValueRow label="HSN code" value={item.hsn_code} /> : null}
              {item.barcode ? <KeyValueRow label="Barcode" value={item.barcode} /> : null}
              {item.max_stock_level ? (
                <KeyValueRow label="Max stock level" value={`${item.max_stock_level} ${item.unit_of_measure}`} />
              ) : null}
            </View>
          </Card>
        </View>
        {item.description ? (
          <View className="px-4 pt-2">
            <Card>
              <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Description
              </Text>
              <Text className="text-sm text-foreground">{item.description}</Text>
            </Card>
          </View>
        ) : null}
      </View>

      {/* Batches */}
      <View>
        <SectionHeader title="Batches" count={`${batchList.length} batch${batchList.length === 1 ? "" : "es"}`} />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              {batchList.length === 0 ? (
                <Text className="text-sm text-muted-foreground py-3 px-2">No batches recorded yet.</Text>
              ) : (
                batchList.map((batch, i) => {
                  const days = daysUntilExpiry(batch.expiry_date);
                  return (
                    <View key={batch.id}>
                      <View className="flex-row items-center justify-between px-2 py-2.5 gap-2">
                        <View className="flex-1 gap-0.5">
                          <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                            {batch.batch_number}
                          </Text>
                          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {batch.quantity} {item.unit_of_measure}
                            {batch.supplier ? ` · ${batch.supplier}` : ""}
                            {batch.expiry_date ? ` · Exp ${formatDate(batch.expiry_date)}` : ""}
                          </Text>
                        </View>
                        {days !== null && days < 0 ? (
                          <Chip label="Expired" variant="danger" />
                        ) : days !== null && days <= 60 ? (
                          <Chip label="Expiring soon" variant="warning" />
                        ) : null}
                      </View>
                      {i < batchList.length - 1 ? <View className="h-px bg-border/60" /> : null}
                    </View>
                  );
                })
              )}
            </View>
          </Card>
        </View>
      </View>

      {/* Stock movement history */}
      <View>
        <SectionHeader
          title="Stock movements"
          count={`${historyItems.length} of ${history?.count ?? 0}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {historyItems.length === 0 ? (
                <Text className="text-sm text-muted-foreground">No stock movements yet.</Text>
              ) : (
                historyItems.map((tx, i) => (
                  <TimelineRow
                    key={tx.id}
                    title={`${tx.transaction_type_label} · ${tx.is_addition ? "+" : "-"}${Math.abs(tx.quantity)} ${tx.item_unit}`}
                    subtitle={[tx.batch_number, tx.notes, `${tx.quantity_before} → ${tx.quantity_after}`]
                      .filter(Boolean)
                      .join(" · ")}
                    when={formatDateTime(tx.created_at)}
                    tint={TRANSACTION_TINT[tx.transaction_type] ?? "slate"}
                    icon={TRANSACTION_ICON[tx.transaction_type] ?? "swap-horizontal"}
                    isLast={i === historyItems.length - 1}
                  />
                ))
              )}
            </View>
          </Card>
        </View>
      </View>

      {canManage ? (
        <View className="px-4">
          <Button
            title={item.is_active ? "Deactivate item" : "Item is inactive"}
            variant="destructive"
            disabled={!item.is_active}
            onPress={handleDeactivate}
            loading={deactivateItem.isPending}
          />
        </View>
      ) : null}

      {canManage && sheetKind ? (
        <StockActionsSheet
          visible={Boolean(sheetKind)}
          initialTab={sheetKind}
          item={item}
          batches={batchList}
          onClose={() => setSheetKind(null)}
        />
      ) : null}
    </ScrollView>
  );
}
