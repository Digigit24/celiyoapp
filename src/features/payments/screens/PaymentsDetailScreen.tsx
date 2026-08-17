import React, { useLayoutEffect } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
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
  DEMO_PAYMENT_QUICK_STATS,
  formatINR,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_CHIP_VARIANT,
  PAYMENT_STATUS_LABELS,
} from "../constants";
import { usePayment } from "../hooks";
import type { PaymentsStackParamList } from "./PaymentsListScreen";

type Props = NativeStackScreenProps<PaymentsStackParamList, "PaymentsDetail">;

export function PaymentsDetailScreen({ route, navigation }: Props) {
  const { paymentId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: payment, isLoading } = usePayment(paymentId);

  useLayoutEffect(() => {
    if (payment) {
      navigation.setOptions({
        title: payment.transactionRef,
        headerRight: () => (
          <View className="pr-1 flex-row items-center gap-2">
            <Chip label="Coming soon" variant="neutral" />
            <Chip
              label={PAYMENT_STATUS_LABELS[payment.status]}
              variant={PAYMENT_STATUS_CHIP_VARIANT[payment.status]}
            />
          </View>
        ),
      });
    }
  }, [navigation, payment]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!payment) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">
          Payment not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The transaction may have been refunded or removed. Try going back to
          the list.
        </Text>
      </View>
    );
  }

  const breakdownTotal = payment.breakdown.reduce((sum, l) => sum + l.amount, 0);
  const isLargeList = payment.breakdown.length > 4;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Sticky identity header — Avatar + name + KeyValueRow summary */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={payment.patientName} size="lg" />
            <View className="flex-1 gap-1">
              <Text
                className="text-base font-semibold text-foreground"
                numberOfLines={1}
              >
                {payment.patientName}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {payment.patientId} · {payment.transactionRef}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip
                  label={PAYMENT_STATUS_LABELS[payment.status]}
                  variant={PAYMENT_STATUS_CHIP_VARIANT[payment.status]}
                />
                <Chip
                  label={PAYMENT_METHOD_LABELS[payment.method]}
                  variant="neutral"
                />
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
                {formatINR(payment.amount)}
              </Text>
              <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                {payment.relatedRef}
              </Text>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Paid by" value={payment.payer} />
            <KeyValueRow label="Channel" value={PAYMENT_METHOD_LABELS[payment.method]} />
            <KeyValueRow
              label="When"
              value={`${payment.date} · ${payment.time}`}
            />
            <KeyValueRow
              label="Received by"
              value={payment.receivedBy}
              action={{ icon: "call-outline", onPress: () => {}, label: "Call cashier" }}
            />
            {payment.gatewayRef ? (
              <KeyValueRow
                label="Gateway ref"
                value={payment.gatewayRef}
                action={{
                  icon: "copy-outline",
                  onPress: () => {},
                  label: "Copy gateway ref",
                }}
              />
            ) : null}
          </View>
        </Card>
      </View>

      {/* Quick stats — 2x2 grid of aggregate numbers */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile
              icon="trending-up-outline"
              label="Total collected"
              value={formatINR(DEMO_PAYMENT_QUICK_STATS.totalCollected)}
              tint="emerald"
              hint="Across all tenants · this month"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="hourglass-outline"
              label="Pending"
              value={formatINR(DEMO_PAYMENT_QUICK_STATS.pendingAmount)}
              tint="amber"
              hint="Awaiting TPA / payer"
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="refresh-circle-outline"
              label="Refunded"
              value={formatINR(DEMO_PAYMENT_QUICK_STATS.refundedAmount)}
              tint="violet"
              hint="This month · all reasons"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="today-outline"
              label="Today"
              value={String(DEMO_PAYMENT_QUICK_STATS.todayCount)}
              tint="blue"
              hint="Transactions settled"
            />
          </View>
        </View>
      </View>

      {/* Amount breakdown */}
      <View>
        <SectionHeader
          title="Amount breakdown"
          count={`${payment.breakdown.length} line${payment.breakdown.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              {payment.breakdown.map((line, i) => (
                <View key={`${line.label}-${i}`}>
                  <View className="flex-row items-center justify-between px-1 py-2.5">
                    <Text
                      className="text-sm text-foreground flex-1 pr-2"
                      numberOfLines={isLargeList ? 1 : 2}
                    >
                      {line.label}
                    </Text>
                    <Text
                      className="text-sm font-semibold font-mono text-foreground"
                      numberOfLines={1}
                    >
                      {formatINR(line.amount)}
                    </Text>
                  </View>
                  {i < payment.breakdown.length - 1 ? (
                    <View className="h-px bg-border/60" />
                  ) : null}
                </View>
              ))}
              <View className="h-px bg-border" />
              <View className="flex-row items-center justify-between px-1 py-2.5">
                <Text className="text-sm font-semibold text-foreground">
                  Total
                </Text>
                <Text className="text-base font-bold font-mono text-foreground">
                  {formatINR(breakdownTotal)}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      {/* Payer + related visit */}
      <View>
        <SectionHeader title="Payer & related encounter" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="Payer" value={payment.payer} />
              <KeyValueRow
                label="Related module"
                value={payment.relatedModule.toUpperCase()}
              />
              <KeyValueRow
                label="Encounter ref"
                value={payment.relatedRef}
                action={{ icon: "open-outline", onPress: () => {}, label: "Open encounter" }}
              />
            </View>
          </Card>
        </View>
      </View>

      {/* Transaction timeline */}
      <View>
        <SectionHeader
          title="Transaction timeline"
          count={`${payment.timeline.length} event${payment.timeline.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {payment.timeline.map((event, i) => (
                <TimelineRow
                  key={`${event.title}-${i}`}
                  title={event.title}
                  subtitle={event.subtitle}
                  when={event.when}
                  tint={event.tint}
                  icon={event.icon}
                  isLast={i === payment.timeline.length - 1}
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
                Live payments arrive in Phase 3
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                Refund, capture, and audit actions ship with the Phase 3 payments
                integration. Auth and permissions are already wired.
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Action footer — disabled because the module is in Phase 3 */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download receipt"
            disabled
            className="flex-1 h-11 items-center justify-center rounded-lg border border-border bg-card opacity-50"
          >
            <Text className="text-sm font-semibold text-muted-foreground">
              Download receipt
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Issue refund"
            disabled
            className="flex-1 h-11 items-center justify-center rounded-lg border border-border bg-card opacity-50"
          >
            <Text className="text-sm font-semibold text-muted-foreground">
              Issue refund
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
