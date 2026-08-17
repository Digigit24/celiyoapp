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
  LAB_STATUS_CHIP_VARIANT,
  LAB_STATUS_LABELS,
  RESULT_FLAG_CHIP_VARIANT,
  RESULT_FLAG_LABELS,
} from "../constants";
import { useLabOrder } from "../hooks";
import type { LabStackParamList } from "./LabListScreen";

type Props = NativeStackScreenProps<LabStackParamList, "LabDetail">;

export function LabDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: order, isLoading } = useLabOrder(orderId);

  useLayoutEffect(() => {
    if (order) {
      navigation.setOptions({
        title: order.orderRef,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={LAB_STATUS_LABELS[order.status]}
              variant={LAB_STATUS_CHIP_VARIANT[order.status]}
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

  const totalTests = order.tests.length;
  const resultedTests = order.tests.filter((t) => t.resultValue).length;
  const abnormalTests = order.tests.filter(
    (t) => t.flag && t.flag !== "normal"
  ).length;
  const criticalTests = order.tests.filter((t) => t.flag === "critical").length;
  const isLargeList = order.tests.length > 4;

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
                  label={LAB_STATUS_LABELS[order.status]}
                  variant={LAB_STATUS_CHIP_VARIANT[order.status]}
                />
                {criticalTests > 0 ? (
                  <Chip label="Critical value" variant="danger" />
                ) : null}
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Panels" value={order.panels.join(", ")} />
            <KeyValueRow label="Ordered by" value={order.orderingDoctor} />
            <KeyValueRow label="Ordered" value={`${order.date} · ${order.time}`} />
          </View>
        </Card>
      </View>

      {/* Quick stats */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile icon="list-outline" label="Total tests" value={totalTests} tint="blue" />
          </View>
          <View className="flex-1">
            <StatTile icon="document-text-outline" label="Reported" value={resultedTests} tint="emerald" />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="warning-outline"
              label="Abnormal"
              value={abnormalTests}
              tint={abnormalTests > 0 ? "amber" : "slate"}
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="alert-circle-outline"
              label="Critical"
              value={criticalTests}
              tint={criticalTests > 0 ? "rose" : "slate"}
            />
          </View>
        </View>
      </View>

      {/* Sample info */}
      <View>
        <SectionHeader title="Sample" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="Sample type" value={order.sample.sampleType} />
              <KeyValueRow label="Collected by" value={order.sample.collectedBy} />
              <KeyValueRow label="Collected at" value={order.sample.collectedAt} />
            </View>
          </Card>
        </View>
      </View>

      {/* Test lines */}
      <View>
        <SectionHeader
          title="Test results"
          count={`${order.tests.length} test${order.tests.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              {order.tests.map((line, i) => (
                <View key={`${line.testName}-${i}`}>
                  <View className="flex-row items-center justify-between px-1 py-2.5 gap-2">
                    <View className="flex-1 gap-0.5">
                      <Text
                        className="text-sm font-semibold text-foreground"
                        numberOfLines={isLargeList ? 1 : 2}
                      >
                        {line.testName}
                      </Text>
                      <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        Normal range: {line.normalRange}
                      </Text>
                      {line.resultValue ? (
                        <Text className="font-mono text-xs text-foreground" numberOfLines={1}>
                          Result: {line.resultValue}
                        </Text>
                      ) : null}
                    </View>
                    {line.flag ? (
                      <Chip
                        label={RESULT_FLAG_LABELS[line.flag]}
                        variant={RESULT_FLAG_CHIP_VARIANT[line.flag]}
                      />
                    ) : (
                      <Chip label="Pending" variant="neutral" />
                    )}
                  </View>
                  {i < order.tests.length - 1 ? (
                    <View className="h-px bg-border/60" />
                  ) : null}
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* Status timeline */}
      <View>
        <SectionHeader
          title="Status timeline"
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
                Live results arrive in Phase 3
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                Sample tracking and result entry ship with the Phase 3
                diagnostics integration. Auth and permissions are already
                wired.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
