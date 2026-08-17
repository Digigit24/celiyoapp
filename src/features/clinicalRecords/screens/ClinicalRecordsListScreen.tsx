import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Chip, EmptyState, SearchHeader, FilterBar, Card, Skeleton } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  ENCOUNTER_FILTER_OPTIONS,
  encounterTypeChipVariant,
  encounterTypeLabel,
  formatDateTime,
  STATUS_CHIP_VARIANT,
  STATUS_FILTER_OPTIONS,
  STATUS_LABELS,
  truncateId,
} from "../constants";
import { useClinicalRecordsList } from "../hooks";
import type {
  ClinicalRecordEncounterType,
  ClinicalRecordListItem,
  ClinicalRecordStatus,
} from "../../../types/clinicalRecords";

/**
 * Param list for the Clinical Records stack, registered in
 * `src/navigation/ClinicalRecordsStack.tsx`.
 */
export type ClinicalRecordsStackParamList = {
  ClinicalRecordsList: undefined;
  ClinicalRecordsDetail: { recordId: number };
};

type Props = NativeStackScreenProps<ClinicalRecordsStackParamList, "ClinicalRecordsList">;

function ClinicalRecordRow({ record, onPress }: { record: ClinicalRecordListItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open clinical record ${record.form_name}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="document-text-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {record.form_name}
            </Text>
            <Chip
              label={encounterTypeLabel(record.encounter_type)}
              variant={encounterTypeChipVariant(record.encounter_type)}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {record.encounter_type} #{record.encounter_id} · {formatDateTime(record.created_at)}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {record.form_code} · Patient {truncateId(record.patient_user_id)}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Chip label={STATUS_LABELS[record.status]} variant={STATUS_CHIP_VARIANT[record.status]} />
        </View>
      </Card>
    </Pressable>
  );
}

export function ClinicalRecordsListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [encounterType, setEncounterType] = useState<"all" | ClinicalRecordEncounterType>("all");
  const [status, setStatus] = useState<"all" | ClinicalRecordStatus>("all");

  const { data, isLoading, isError, refetch, isRefetching } = useClinicalRecordsList({
    search: query.trim() || undefined,
    encounter_type: encounterType === "all" ? undefined : (encounterType as "opd_visit" | "ipd_admission"),
    status: status === "all" ? undefined : status,
  });
  const records = data?.results ?? [];

  const headerSubtitle = useMemo(() => {
    if (!data) return "";
    return `${records.length} of ${data.count} record${data.count === 1 ? "" : "s"}`;
  }, [data, records.length]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader value={query} onChange={setQuery} placeholder="Search encounter, form name, or code" />
      <FilterBar
        options={ENCOUNTER_FILTER_OPTIONS}
        value={encounterType}
        onChange={(id) => setEncounterType(id as "all" | ClinicalRecordEncounterType)}
      />
      <FilterBar
        options={STATUS_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | ClinicalRecordStatus)}
      />

      {isLoading ? (
        <View className="px-4 gap-2 pt-2">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
            gap: 10,
          }}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Clinical Records
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground/70">{headerSubtitle}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ClinicalRecordRow
              record={item}
              onPress={() => navigation.navigate("ClinicalRecordsDetail", { recordId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Couldn't load clinical records"
                message="Check your connection and try again."
                action={
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => refetch()}
                    className="rounded-lg bg-primary px-4 py-2"
                  >
                    <Text className="text-sm font-semibold text-primary-foreground">Retry</Text>
                  </Pressable>
                }
              />
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="No clinical records found"
                message={
                  query.length > 0
                    ? "Try a different search or filter."
                    : "Records created from OPD/IPD encounters will appear here."
                }
              />
            )
          }
        />
      )}
    </View>
  );
}
