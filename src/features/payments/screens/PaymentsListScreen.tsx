import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Chip,
  EmptyState,
  SearchHeader,
  FilterBar,
  Card,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  formatINR,
  PAYMENT_FILTER_OPTIONS,
  PAYMENT_STATUS_CHIP_VARIANT,
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
  type PaymentTransaction,
  type PaymentMethod,
} from "../constants";
import { usePaymentsList } from "../hooks";

/**
 * Param list for the future Payments stack. The orchestrator owns the actual
 * stack registration; exporting the type here keeps the contract typed.
 */
export type PaymentsStackParamList = {
  PaymentsList: undefined;
  PaymentsDetail: { paymentId: string };
};

type Props = NativeStackScreenProps<PaymentsStackParamList, "PaymentsList">;

const METHOD_ICON: Record<PaymentMethod, keyof typeof Ionicons.glyphMap> = {
  cash: "cash-outline",
  upi: "phone-portrait-outline",
  card: "card-outline",
  netbanking: "globe-outline",
  wallet: "wallet-outline",
  insurance: "shield-checkmark-outline",
};

/** Compact display label for the row — "17 Aug · 10:42". */
function formatDateTime(date: string, time: string): string {
  // Parse the ISO yyyy-mm-dd by hand so we don't trip on timezone drift.
  const [y, m, d] = date.split("-").map((n) => Number.parseInt(n, 10));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const label = months[m - 1] ?? "—";
  return `${d} ${label} · ${time}`;
}

function PaymentRow({
  payment,
  onPress,
}: {
  payment: PaymentTransaction;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open payment ${payment.transactionRef}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons
            name={METHOD_ICON[payment.method]}
            size={18}
            color="#0f172a"
          />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground"
              numberOfLines={1}
            >
              {payment.patientName}
            </Text>
            <Chip
              label={PAYMENT_STATUS_LABELS[payment.status]}
              variant={PAYMENT_STATUS_CHIP_VARIANT[payment.status]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {formatDateTime(payment.date, payment.time)} · {payment.transactionRef}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {payment.relatedRef} · {payment.payer}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text
            className="text-[15px] font-bold text-foreground"
            numberOfLines={1}
          >
            {formatINR(payment.amount)}
          </Text>
          <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
            {payment.method.toUpperCase()}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function PaymentsListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | PaymentStatus>("all");

  const { data, totalCount } = usePaymentsList({
    search: query,
    status,
  });

  const headerSubtitle = useMemo(() => {
    if (query.length === 0 && status === "all") {
      return `${data.length} of ${totalCount} transactions`;
    }
    return `${data.length} match${data.length === 1 ? "" : "es"}`;
  }, [data.length, query.length, status, totalCount]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search patient, ref, or transaction ID"
      />
      <FilterBar
        options={PAYMENT_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | PaymentStatus)}
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
              Transactions
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PaymentRow
            payment={item}
            onPress={() =>
              navigation.navigate("PaymentsDetail", { paymentId: item.id })
            }
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon="card-outline"
            title="No payments found"
            message={
              query.length > 0
                ? "Try a different search or status filter."
                : "Payments recorded at the cashier will appear here."
            }
          />
        }
      />
    </View>
  );
}
