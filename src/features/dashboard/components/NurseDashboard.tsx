import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Badge, EmptyState, ListItem } from "../../../components/ui";
import { useAuth } from "../../../store/AuthContext";
import type { AppDrawerParamList } from "../../../navigation/routes";
import { useAdmissions } from "../../ipd/hooks";
import { useDashboardOverview, useWardOccupancy } from "../hooks";
import { useDashboardPalette } from "../palette";
import { goToIpdAdmission } from "../navigate";
import { ProgressMeter, StatTile, WidgetCard } from "./widgets";

type Nav = DrawerNavigationProp<AppDrawerParamList>;
const TODAY = new Date().toISOString().slice(0, 10);

export function NurseDashboard() {
  const navigation = useNavigation<Nav>();
  const { can } = useAuth();
  const palette = useDashboardPalette();
  const canIpd = can("hms.ipd.view");

  const overview = useDashboardOverview();
  const wards = useWardOccupancy();
  const active = useAdmissions(canIpd ? { status: "admitted", page_size: 50 } : undefined);
  const admittedToday = useAdmissions(canIpd ? { admission_date__gte: TODAY, page_size: 8 } : undefined);

  if (!canIpd) {
    return (
      <EmptyState
        icon="lock-closed-outline"
        title="No ward access yet"
        message="Ask your admin to grant IPD access to see ward and bed data here."
      />
    );
  }

  const ipd = overview.data?.ipd_statistics;

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        <StatTile icon="bed" tint={palette.ipd} label="In my ward(s)" value={ipd?.currently_admitted ?? 0} loading={overview.isLoading} className="w-[47%]" />
        <StatTile icon="checkmark-circle" tint={palette.success} label="Available beds" value={ipd?.available_beds ?? 0} loading={overview.isLoading} className="w-[47%]" />
        <StatTile icon="log-out" tint={palette.info} label="Discharged today" value={ipd?.discharged_today ?? 0} loading={overview.isLoading} className="w-[47%]" />
        <StatTile
          icon="stats-chart"
          tint={palette.warning}
          label="Occupancy"
          value={ipd?.occupancy_rate ?? 0}
          format={(n) => `${Math.round(n)}%`}
          loading={overview.isLoading}
          className="w-[47%]"
        />
      </View>

      <WidgetCard
        title="Ward occupancy"
        loading={wards.isLoading}
        error={wards.isError}
        onRetry={() => wards.refetch()}
        empty={(wards.data?.length ?? 0) === 0}
      >
        <View className="gap-4">
          {(wards.data ?? []).map((w) => (
            <ProgressMeter
              key={w.ward_id}
              label={w.ward}
              value={`${w.occupied}/${w.total_beds}`}
              percent={w.rate}
            />
          ))}
        </View>
      </WidgetCard>

      <WidgetCard
        title="Active admissions"
        loading={active.isLoading}
        error={active.isError}
        onRetry={() => active.refetch()}
        empty={(active.data?.results.length ?? 0) === 0}
      >
        <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
          {(active.data?.results ?? []).slice(0, 8).map((a) => (
            <ListItem
              key={a.id}
              title={a.patient_name}
              subtitle={`${a.ward_name}${a.bed_number ? ` · Bed ${a.bed_number}` : ""}`}
              leftIcon="bed-outline"
              right={<Badge label={`${a.los_days}d`} variant="secondary" />}
              onPress={() => goToIpdAdmission(navigation, a.id)}
            />
          ))}
        </View>
      </WidgetCard>

      <WidgetCard
        title="Admitted today"
        loading={admittedToday.isLoading}
        empty={(admittedToday.data?.results.length ?? 0) === 0}
      >
        <View className="-mx-4 -mb-4 overflow-hidden rounded-b-3xl">
          {(admittedToday.data?.results ?? []).map((a) => (
            <ListItem
              key={a.id}
              title={a.patient_name}
              subtitle={a.ward_name}
              leftIcon="person-add-outline"
              onPress={() => goToIpdAdmission(navigation, a.id)}
            />
          ))}
        </View>
      </WidgetCard>
    </View>
  );
}
