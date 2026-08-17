import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Card, Chip, EmptyState, SearchHeader, FilterBar } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  DISPENSING_STATUS_CHIP_VARIANT,
  DISPENSING_STATUS_LABELS,
  formatOrderDateTime,
  PHARMACY_FILTER_OPTIONS,
  type DispensingStatus,
  type PharmacyOrder,
} from "../constants";
import { usePharmacyList } from "../hooks";

/**
 * Param list for the future Pharmacy stack. The orchestrator owns the actual
 * stack registration; exporting the type here keeps the contract typed.
 */
export type PharmacyStackParamList = {
  PharmacyList: undefined;
  PharmacyDetail: { orderId: string };
};

type Props = NativeStackScreenProps<PharmacyStackParamList, "PharmacyList">;

function PharmacyRow({
  order,
  onPress,
}: {
  order: PharmacyOrder;
  onPress: () => void;
}) {
  const itemCount = order.items.length;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open pharmacy order ${order.orderRef}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="medical-outline" size={18} color="#0f172a" />
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
              label={DISPENSING_STATUS_LABELS[order.status]}
              variant={DISPENSING_STATUS_CHIP_VARIANT[order.status]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {formatOrderDateTime(order.date, order.time)} · {order.orderRef}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {order.prescribingDoctor} · {order.patientId}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
            {itemCount} item{itemCount === 1 ? "" : "s"}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function PharmacyListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DispensingStatus>("all");

  const { data, totalCount } = usePharmacyList({ search: query, status });

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
        placeholder="Search patient, order ref, or doctor"
      />
      <FilterBar
        options={PHARMACY_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | DispensingStatus)}
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
              Dispensing queue
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PharmacyRow
            order={item}
            onPress={() => navigation.navigate("PharmacyDetail", { orderId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon="medical-outline"
            title="No orders found"
            message={
              query.length > 0
                ? "Try a different search or status filter."
                : "Prescriptions sent to pharmacy will appear here."
            }
          />
        }
      />
    </View>
  );
}
