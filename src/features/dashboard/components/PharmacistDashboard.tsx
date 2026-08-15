import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Badge, ListItem } from "../../../components/ui";
import type { AppDrawerParamList } from "../../../navigation/routes";
import { useAlertsSummary, useDashboardInventory, useOpenAlerts, useRecentEncounters } from "../hooks";
import { useDashboardPalette } from "../palette";
import { goToIpdAdmission, goToOpdVisit } from "../navigate";
import { Gate, SegmentedBar, StatTile, WidgetCard } from "./widgets";

type Nav = DrawerNavigationProp<AppDrawerParamList>;

export function PharmacistDashboard() {
  const navigation = useNavigation<Nav>();
  const palette = useDashboardPalette();

  const inventory = useDashboardInventory();
  const recent = useRecentEncounters({ page_size: 6 });
  const alertsSummary = useAlertsSummary("pharmacy");
  const openAlerts = useOpenAlerts("pharmacy");

  const hasInventory = inventory.data?.inventory_dashboard?.has_inventory_items === true;
  const byType = Object.entries(alertsSummary.data?.by_type ?? {});

  return (
    <View className="gap-4">
      <WidgetCard
        title="Recent encounters"
        loading={recent.isLoading}
        error={recent.isError}
        onRetry={() => recent.refetch()}
        empty={(recent.data?.results.length ?? 0) === 0}
      >
        <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
          {(recent.data?.results ?? []).map((e) => (
            <ListItem
              key={`${e.encounter_type}-${e.encounter_id}`}
              title={e.patient_name}
              subtitle={`${e.number} · ${e.doctor_name ?? "—"}`}
              leftIcon={e.encounter_type === "opd" ? "medkit-outline" : "bed-outline"}
              right={
                e.pending_pharmacy_count > 0 ? (
                  <Badge label={`${e.pending_pharmacy_count} pending`} variant="warning" />
                ) : (
                  <Badge label="Dispensed" variant="secondary" />
                )
              }
              onPress={() =>
                e.encounter_type === "opd"
                  ? goToOpdVisit(navigation, e.encounter_id)
                  : goToIpdAdmission(navigation, e.encounter_id)
              }
            />
          ))}
        </View>
      </WidgetCard>

      <Gate show={hasInventory}>
        <View className="flex-row flex-wrap gap-3">
          <StatTile
            icon="cash"
            tint={palette.primary}
            label="Stock value"
            value={parseFloat(inventory.data?.inventory_dashboard?.total_stock_value ?? "0")}
            format={(n) => `₹${(n / 1000).toFixed(1)}K`}
            loading={inventory.isLoading}
            className="w-[47%]"
          />
          <StatTile icon="trending-down" tint={palette.warning} label="Low stock" value={inventory.data?.inventory_dashboard?.low_stock_count ?? 0} loading={inventory.isLoading} className="w-[47%]" />
          <StatTile icon="time" tint={palette.danger} label="Expiring soon" value={inventory.data?.inventory_dashboard?.expiring_soon_count ?? 0} loading={inventory.isLoading} className="w-[47%]" />
          <StatTile icon="close-circle" tint={palette.neutral} label="Out of stock" value={inventory.data?.pharmacy_product_stats?.out_of_stock_products ?? 0} loading={inventory.isLoading} className="w-[47%]" />
        </View>
      </Gate>

      <Gate show={byType.length > 0}>
        <WidgetCard title="Alerts by type" loading={alertsSummary.isLoading}>
          <SegmentedBar
            segments={byType.map(([label, value]) => ({ label: label.replace(/_/g, " "), value }))}
            summary={String(alertsSummary.data?.unacknowledged ?? 0)}
            summaryLabel="Unacknowledged"
          />
        </WidgetCard>
      </Gate>

      <WidgetCard
        title="Open alerts"
        loading={openAlerts.isLoading}
        error={openAlerts.isError}
        onRetry={() => openAlerts.refetch()}
        empty={(openAlerts.data?.length ?? 0) === 0}
        emptyMessage="No open alerts"
      >
        <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
          {(openAlerts.data ?? []).map((a) => (
            <ListItem
              key={a.id}
              title={a.item_name ?? a.alert_type.replace(/_/g, " ")}
              subtitle={a.message}
              leftIcon="warning-outline"
              chevron={false}
            />
          ))}
        </View>
      </WidgetCard>
    </View>
  );
}
