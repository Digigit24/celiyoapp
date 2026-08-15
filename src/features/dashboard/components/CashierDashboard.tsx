import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Badge, ListItem, TabStrip } from "../../../components/ui";
import type { AppDrawerParamList } from "../../../navigation/routes";
import {
  useBillPaymentsStats,
  useDashboardFinancial,
  useRecentBillPayments,
  useUnpaidIpdBills,
  useUnpaidOpdBills,
} from "../hooks";
import { buildRange, formatCurrency, type RangeKey } from "../utils";
import { useDashboardPalette } from "../palette";
import { goToModule } from "../navigate";
import { MiniBarChart, RangePicker, SegmentedBar, StatTile, WidgetCard } from "./widgets";

type Nav = DrawerNavigationProp<AppDrawerParamList>;

export function CashierDashboard() {
  const navigation = useNavigation<Nav>();
  const palette = useDashboardPalette();
  const [rangeKey, setRangeKey] = useState<RangeKey>("week");
  const [worklistTab, setWorklistTab] = useState<"opd" | "ipd">("opd");
  const range = useMemo(() => buildRange(rangeKey), [rangeKey]);

  const fixedStats = useBillPaymentsStats();
  const rangedStats = useBillPaymentsStats({ date_from: range.date_from, date_to: range.date_to });
  const financial = useDashboardFinancial();
  const recentPayments = useRecentBillPayments();
  const unpaidOpd = useUnpaidOpdBills();
  const unpaidIpd = useUnpaidIpdBills();

  const pendingDues =
    (parseFloat(financial.data?.opd_bill_stats?.pending_amount ?? "0") || 0) +
    (financial.data?.ipd_billing_stats?.pending_amount ?? 0);

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        <StatTile icon="today" tint={palette.primary} label="Collected today" value={fixedStats.data?.collected_today ?? 0} format={formatCurrency} loading={fixedStats.isLoading} className="w-[47%]" />
        <StatTile icon="calendar" tint={palette.info} label="This week" value={fixedStats.data?.collected_this_week ?? 0} format={formatCurrency} loading={fixedStats.isLoading} className="w-[47%]" />
        <StatTile icon="stats-chart" tint={palette.success} label="This month" value={fixedStats.data?.collected_this_month ?? 0} format={formatCurrency} loading={fixedStats.isLoading} className="w-[47%]" />
        <StatTile
          icon="alert-circle"
          tint={palette.warning}
          label="Pending dues"
          value={pendingDues}
          format={formatCurrency}
          loading={financial.isLoading}
          onPress={() => goToModule(navigation, "payments", "Payments")}
          className="w-[47%]"
        />
      </View>

      <View className="flex-row items-center justify-between px-1">
        <Text className="text-sm font-semibold text-foreground">Collections trend</Text>
        <RangePicker value={rangeKey} onChange={setRangeKey} />
      </View>

      <WidgetCard
        title="Trend"
        loading={rangedStats.isLoading}
        error={rangedStats.isError}
        onRetry={() => rangedStats.refetch()}
        empty={(rangedStats.data?.daily_trend.length ?? 0) === 0}
      >
        <MiniBarChart
          points={(rangedStats.data?.daily_trend ?? []).map((p) => ({ label: p.date.slice(5), value: p.total }))}
          color={palette.success}
          format={formatCurrency}
        />
      </WidgetCard>

      <WidgetCard
        title="Collections by mode"
        loading={rangedStats.isLoading}
        empty={(rangedStats.data?.by_mode.length ?? 0) === 0}
      >
        <SegmentedBar
          segments={(rangedStats.data?.by_mode ?? []).map((m) => ({ label: m.payment_mode, value: m.total }))}
          format={formatCurrency}
          summary={formatCurrency(rangedStats.data?.total_collected)}
          summaryLabel={`Total · ${range.label}`}
        />
      </WidgetCard>

      <WidgetCard title="Unpaid bills">
        <View className="-mx-4 -mt-1 mb-3">
          <TabStrip
            tabs={[
              { key: "opd", label: `OPD (${unpaidOpd.data?.length ?? 0})` },
              { key: "ipd", label: `IPD (${unpaidIpd.data?.length ?? 0})` },
            ]}
            activeKey={worklistTab}
            onChange={setWorklistTab}
          />
        </View>
        <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
          {worklistTab === "opd" &&
            (!unpaidOpd.data || unpaidOpd.data.length === 0 ? (
              <EmptyRow text="No unpaid OPD bills" />
            ) : (
              unpaidOpd.data.map((b) => (
                <ListItem
                  key={b.id}
                  title={b.patient_name}
                  subtitle={`${b.bill_number} · ${new Date(b.bill_date).toLocaleDateString()}`}
                  leftIcon="document-text-outline"
                  right={<Badge label={formatCurrency(b.balance_amount)} variant="destructive" />}
                  onPress={() => goToModule(navigation, "payments", "Payments")}
                />
              ))
            ))}
          {worklistTab === "ipd" &&
            (!unpaidIpd.data || unpaidIpd.data.length === 0 ? (
              <EmptyRow text="No unpaid IPD bills" />
            ) : (
              unpaidIpd.data.map((b) => (
                <ListItem
                  key={b.id}
                  title={b.patient_name}
                  subtitle={`${b.bill_number} · ${new Date(b.bill_date).toLocaleDateString()}`}
                  leftIcon="document-text-outline"
                  right={<Badge label={formatCurrency(b.balance_amount)} variant="destructive" />}
                  onPress={() => goToModule(navigation, "payments", "Payments")}
                />
              ))
            ))}
        </View>
      </WidgetCard>

      <WidgetCard
        title="Recent transactions"
        loading={recentPayments.isLoading}
        error={recentPayments.isError}
        onRetry={() => recentPayments.refetch()}
        empty={(recentPayments.data?.length ?? 0) === 0}
      >
        <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
          {(recentPayments.data ?? []).map((p) => (
            <ListItem
              key={p.id}
              title={formatCurrency(p.amount)}
              subtitle={`${p.payment_mode} · ${new Date(p.payment_date).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}`}
              leftIcon="cash-outline"
              chevron={false}
            />
          ))}
        </View>
      </WidgetCard>
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View className="items-center bg-card px-4 py-6">
      <Text className="text-xs text-muted-foreground">{text}</Text>
    </View>
  );
}
