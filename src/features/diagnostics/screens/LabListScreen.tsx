import React, { useLayoutEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, EmptyState, SearchHeader, FilterBar, Skeleton } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  formatDateTime,
  LAB_FILTER_OPTIONS,
  ORDER_STATUS_CHIP_VARIANT,
  ORDER_STATUS_LABELS,
} from "../constants";
import { useLabDashboard } from "../hooks";
import type { DiagnosticOrder, DiagnosticOrderStatus } from "../../../types/diagnostics";

/**
 * Param list for the Lab stack, registered in `src/navigation/DiagnosticsStack.tsx`.
 */
export type LabStackParamList = {
  LabList: undefined;
  LabDetail: { orderId: number };
  NewLabOrder: undefined;
};

type Props = NativeStackScreenProps<LabStackParamList, "LabList">;

function LabRow({ order, onPress }: { order: DiagnosticOrder; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open lab order for ${order.patient_name}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="flask-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {order.patient_name}
            </Text>
            <Chip label={ORDER_STATUS_LABELS[order.status]} variant={ORDER_STATUS_CHIP_VARIANT[order.status]} />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {order.investigation_name}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {formatDateTime(order.created_at)} · ₹{order.price}
            {order.sample_id ? ` · Sample ${order.sample_id}` : ""}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function LabListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { can } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"active" | DiagnosticOrderStatus>("active");
  const canCreate = can("hms.diagnostics.create");

  const { data, isLoading, isError, refetch, isRefetching } = useLabDashboard({
    search: query.trim() || undefined,
    status: status === "active" ? undefined : status,
  });
  const orders = data?.results ?? [];

  useLayoutEffect(() => {
    if (!canCreate) return;
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New lab order"
          hitSlop={10}
          onPress={() => navigation.navigate("NewLabOrder")}
          className="pr-1"
        >
          <Ionicons name="add-circle-outline" size={24} color="#2563eb" />
        </Pressable>
      ),
    });
  }, [navigation, canCreate]);

  const headerSubtitle = useMemo(() => {
    if (!data) return "";
    return `${orders.length} of ${data.count} order${data.count === 1 ? "" : "s"}`;
  }, [data, orders.length]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader value={query} onChange={setQuery} placeholder="Search patient, test, or sample" />
      <FilterBar
        options={LAB_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "active" | DiagnosticOrderStatus)}
      />

      {isLoading ? (
        <View className="px-4 gap-2 pt-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
            gap: 10,
          }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Test orders
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground/70">{headerSubtitle}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <LabRow order={item} onPress={() => navigation.navigate("LabDetail", { orderId: item.id })} />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Couldn't load lab orders"
                message="Check your connection and try again."
                action={
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => refetch()}
                    className="rounded-lg bg-primary px-4 py-2"
                  >
                    <Text className="text-sm font-semibold text-primary-foreground">Retry</Text>
                  </Pressable>
                }
              />
            ) : (
              <EmptyState
                icon="flask-outline"
                title="No lab orders found"
                message={
                  query.length > 0
                    ? "Try a different search or status filter."
                    : "Test orders sent to the lab will appear here."
                }
              />
            )
          }
        />
      )}
    </View>
  );
}
