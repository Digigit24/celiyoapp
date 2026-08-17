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
  DISPENSING_STATUS_CHIP_VARIANT,
  DISPENSING_STATUS_LABELS,
  STOCK_AVAILABILITY_CHIP_VARIANT,
  STOCK_AVAILABILITY_LABELS,
} from "../constants";
import { usePharmacyOrder } from "../hooks";
import type { PharmacyStackParamList } from "./PharmacyListScreen";

type Props = NativeStackScreenProps<PharmacyStackParamList, "PharmacyDetail">;

export function PharmacyDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: order, isLoading } = usePharmacyOrder(orderId);

  useLayoutEffect(() => {
    if (order) {
      navigation.setOptions({
        title: order.orderRef,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={DISPENSING_STATUS_LABELS[order.status]}
              variant={DISPENSING_STATUS_CHIP_VARIANT[order.status]}
            />
          </View>
        ),
      });
    }
  }, [navigation, order]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">
          Order not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The order may have been removed. Try going back to the list.
        </Text>
      </View>
    );
  }

  const qtyOrderedTotal = order.items.reduce((sum, l) => sum + l.qtyOrdered, 0);
  const qtyDispensedTotal = order.items.reduce((sum, l) => sum + l.qtyDispensed, 0);
  const pendingLines = order.items.filter((l) => l.qtyDispensed < l.qtyOrdered).length;
  const stockAlerts = order.items.filter((l) => l.availability !== "in-stock").length;
  const isLargeList = order.items.length > 4;

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
            <Avatar source={order.patientName} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {order.patientName}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {order.patientId} · {order.orderRef}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip
                  label={DISPENSING_STATUS_LABELS[order.status]}
                  variant={DISPENSING_STATUS_CHIP_VARIANT[order.status]}
                />
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
                {order.items.length}
              </Text>
              <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                items
              </Text>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Prescribed by" value={order.prescribingDoctor} />
            <KeyValueRow label="Ordered" value={`${order.date} · ${order.time}`} />
          </View>
        </Card>
      </View>

      {/* Quick stats */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile
              icon="cube-outline"
              label="Qty ordered"
              value={qtyOrderedTotal}
              tint="blue"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="checkmark-done-outline"
              label="Qty dispensed"
              value={qtyDispensedTotal}
              tint="emerald"
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="hourglass-outline"
              label="Lines pending"
              value={pendingLines}
              tint="amber"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="alert-circle-outline"
              label="Stock alerts"
              value={stockAlerts}
              tint={stockAlerts > 0 ? "rose" : "slate"}
            />
          </View>
        </View>
      </View>

      {/* Drug lines */}
      <View>
        <SectionHeader
          title="Prescribed items"
          count={`${order.items.length} line${order.items.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              {order.items.map((line, i) => (
                <View key={`${line.drugName}-${i}`}>
                  <View className="flex-row items-center justify-between px-1 py-2.5 gap-2">
                    <View className="flex-1 gap-0.5">
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={isLargeList ? 1 : 2}
                      >
                        {line.drugName} · {line.strength}
                      </Text>
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {line.qtyDispensed}/{line.qtyOrdered} {line.unit}
                      </Text>
                    </View>
                    <Chip
                      label={STOCK_AVAILABILITY_LABELS[line.availability]}
                      variant={STOCK_AVAILABILITY_CHIP_VARIANT[line.availability]}
                    />
                  </View>
                  {i < order.items.length - 1 ? (
                    <View className="h-px bg-border/60" />
                  ) : null}
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* Dispensing timeline */}
      <View>
        <SectionHeader
          title="Dispensing timeline"
          count={`${order.timeline.length} event${order.timeline.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {order.timeline.map((event, i) => (
                <TimelineRow
                  key={`${event.title}-${i}`}
                  title={event.title}
                  subtitle={event.subtitle}
                  when={event.when}
                  tint={event.tint}
                  icon={event.icon}
                  isLast={i === order.timeline.length - 1}
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
                Live dispensing arrives in Phase 3
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                Marking items dispensed and stock deduction ship with the
                Phase 3 pharmacy integration. Auth and permissions are
                already wired.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
