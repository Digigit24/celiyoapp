import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Card, Chip, EmptyState, FilterBar, StatTile } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  BILL_TYPE_CHIP_VARIANT,
  formatINR,
  formatPaymentDate,
  PAYMENT_METHOD_LABELS,
  PAYMENTS_BILL_TYPE_FILTER_OPTIONS,
} from "../constants";
import { usePaymentsList, usePaymentStats } from "../hooks";
import type { Payment, PaymentBillType } from "../../../types/payments";

/**
 * Param list for the Payments stack. The orchestrator owns the actual stack
 * registration; exporting the type here keeps the contract typed.
 */
export type PaymentsStackParamList = {
  PaymentsList: undefined;
  PaymentsDetail: { paymentId: string };
  PaymentForm: { paymentId?: string };
};

type Props = NativeStackScreenProps<PaymentsStackParamList, "PaymentsList">;

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function PaymentRow({ payment, onPress }: { payment: Payment; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open payment ${payment.receipt_number ?? payment.id}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="cash-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {payment.patient_name || "Freestanding payment"}
            </Text>
            <Chip
              label={payment.bill_type_label}
              variant={BILL_TYPE_CHIP_VARIANT[payment.bill_type]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {formatPaymentDate(payment.payment_date)} · {payment.payment_mode_label}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {payment.receipt_number ?? "No receipt"}
            {payment.bill_number ? ` · ${payment.bill_number}` : ""}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
            {formatINR(payment.amount)}
          </Text>
          <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
            {PAYMENT_METHOD_LABELS[payment.payment_mode].toUpperCase()}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function PaymentsListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { can } = useAuth();
  const canCreate = can("hms.payments.create");

  const [billType, setBillType] = useState<"all" | PaymentBillType>("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const params = {
    bill_type: billType === "all" ? undefined : billType,
    payment_date: dateFilter ? toIsoDate(dateFilter) : undefined,
    ordering: "-created_at" as const,
  };

  const { data, isLoading, isError } = usePaymentsList(params);
  const stats = usePaymentStats();

  const results = data?.results ?? [];
  const headerSubtitle = useMemo(() => {
    if (data == null) return "";
    return `${results.length} of ${data.count} transaction${data.count === 1 ? "" : "s"}`;
  }, [data, results.length]);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Payments
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          className="flex-row items-center gap-1.5"
        >
          <Ionicons name="calendar-outline" size={14} color="#0f172a" />
          <Text className="text-xs font-medium text-foreground">
            {dateFilter ? formatPaymentDate(toIsoDate(dateFilter)) : "Any date"}
          </Text>
          {dateFilter ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear date filter"
              hitSlop={8}
              onPress={() => setDateFilter(null)}
            >
              <Ionicons name="close-circle" size={14} color="#64748b" />
            </Pressable>
          ) : null}
        </Pressable>
      </View>
      <FilterBar
        options={PAYMENTS_BILL_TYPE_FILTER_OPTIONS}
        value={billType}
        onChange={(id) => setBillType(id as "all" | PaymentBillType)}
      />

      {pickerOpen ? (
        <DateTimePicker
          value={dateFilter ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            setPickerOpen(false);
            if (event.type === "dismissed" || !date) return;
            setDateFilter(date);
          }}
        />
      ) : null}

      {stats.data ? (
        <View className="flex-row gap-2.5 px-4 pt-2 pb-1">
          <View className="flex-1">
            <StatTile
              icon="trending-up-outline"
              label="Collected today"
              value={formatINR(stats.data.collected_today)}
              tint="emerald"
              hint={`${stats.data.count_today} transaction${stats.data.count_today === 1 ? "" : "s"}`}
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="wallet-outline"
              label="This month"
              value={formatINR(stats.data.collected_this_month)}
              tint="blue"
              hint={`${stats.data.transaction_count} total transactions`}
            />
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
            gap: 10,
          }}
          ListHeaderComponent={
            headerSubtitle ? (
              <View className="flex-row items-center justify-end pb-2">
                <Text className="text-[11px] font-semibold text-muted-foreground/70">
                  {headerSubtitle}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PaymentRow
              payment={item}
              onPress={() => navigation.navigate("PaymentsDetail", { paymentId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title={isError ? "Couldn't load payments" : "No payments found"}
              message={
                isError
                  ? "Check your connection and try again."
                  : "Payments recorded at the cashier will appear here."
              }
            />
          }
        />
      )}

      {canCreate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Record payment"
          onPress={() => navigation.navigate("PaymentForm", {})}
          className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-black/20 active:opacity-90"
          style={{ bottom: TAB_BAR_CONTENT_INSET + insets.bottom + 12 }}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      ) : null}
    </View>
  );
}
