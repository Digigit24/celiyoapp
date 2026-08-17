import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, EmptyState, SearchHeader, FilterBar } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  formatOrderDateTime,
  LAB_FILTER_OPTIONS,
  LAB_STATUS_CHIP_VARIANT,
  LAB_STATUS_LABELS,
  type LabOrder,
  type LabOrderStatus,
} from "../constants";
import { useLabOrdersList } from "../hooks";

/**
 * Param list for the future Lab stack. The orchestrator owns the actual
 * stack registration; exporting the type here keeps the contract typed.
 */
export type LabStackParamList = {
  LabList: undefined;
  LabDetail: { orderId: string };
};

type Props = NativeStackScreenProps<LabStackParamList, "LabList">;

function LabRow({ order, onPress }: { order: LabOrder; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open lab order ${order.orderRef}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="flask-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground"
              numberOfLines={1}
            >
              {order.patientName}
            </Text>
            <Chip
              label={LAB_STATUS_LABELS[order.status]}
              variant={LAB_STATUS_CHIP_VARIANT[order.status]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {order.panels.join(", ")}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {formatOrderDateTime(order.date, order.time)} · {order.orderRef} · {order.orderingDoctor}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function LabListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | LabOrderStatus>("all");

  const { data, totalCount } = useLabOrdersList({ search: query, status });

  const headerSubtitle = useMemo(() => {
    if (query.length === 0 && status === "all") {
      return `${data.length} of ${totalCount} orders`;
    }
    return `${data.length} match${data.length === 1 ? "" : "es"}`;
  }, [data.length, query.length, status, totalCount]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search patient, ref, panel, or doctor"
      />
      <FilterBar
        options={LAB_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | LabOrderStatus)}
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
              Test orders
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <LabRow
            order={item}
            onPress={() => navigation.navigate("LabDetail", { orderId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon="flask-outline"
            title="No lab orders found"
            message={
              query.length > 0
                ? "Try a different search or status filter."
                : "Test orders sent to the lab will appear here."
            }
          />
        }
      />
    </View>
  );
}
