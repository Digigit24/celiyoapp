import React from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { Badge, ListItem } from "../../../components/ui";
import type { AppDrawerParamList } from "../../../navigation/routes";
import { useDiagnosticStatusCount, useRecentEncounters } from "../hooks";
import { useDashboardPalette } from "../palette";
import { goToIpdAdmission, goToOpdVisit } from "../navigate";
import { StatTile, WidgetCard } from "./widgets";

type Nav = DrawerNavigationProp<AppDrawerParamList>;

export function LabTechnicianDashboard() {
  const navigation = useNavigation<Nav>();
  const palette = useDashboardPalette();

  const ordered = useDiagnosticStatusCount("ordered");
  const sampleCollected = useDiagnosticStatusCount("sample_collected");
  const completed = useDiagnosticStatusCount("completed");
  const cancelled = useDiagnosticStatusCount("cancelled");
  const recent = useRecentEncounters({ page_size: 6 });

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-3">
        <StatTile icon="flask" tint={palette.warning} label="Ordered" value={ordered.data ?? 0} loading={ordered.isLoading} className="w-[47%]" />
        <StatTile icon="water" tint={palette.info} label="Sample collected" value={sampleCollected.data ?? 0} loading={sampleCollected.isLoading} className="w-[47%]" />
        <StatTile icon="checkmark-done" tint={palette.success} label="Completed" value={completed.data ?? 0} loading={completed.isLoading} className="w-[47%]" />
        <StatTile icon="close-circle" tint={palette.neutral} label="Cancelled" value={cancelled.data ?? 0} loading={cancelled.isLoading} className="w-[47%]" />
      </View>

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
                e.pending_lab_count > 0 ? (
                  <Badge label={`${e.pending_lab_count} pending`} variant="warning" />
                ) : (
                  <Badge label="Cleared" variant="secondary" />
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
    </View>
  );
}
