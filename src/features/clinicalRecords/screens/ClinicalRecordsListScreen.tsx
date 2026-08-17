import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
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
  CLINICAL_RECORDS_FILTER_OPTIONS,
  ENCOUNTER_TYPE_CHIP_VARIANT,
  ENCOUNTER_TYPE_LABELS,
  formatRecordDate,
  LOCK_STATUS_CHIP_VARIANT,
  LOCK_STATUS_LABELS,
  type ClinicalRecordEncounterType,
  type ClinicalRecordEntry,
} from "../constants";
import { useClinicalRecordsList } from "../hooks";

/**
 * Param list for the future Clinical Records stack. The orchestrator owns
 * the actual stack registration; exporting the type here keeps the contract
 * typed.
 */
export type ClinicalRecordsStackParamList = {
  ClinicalRecordsList: undefined;
  ClinicalRecordsDetail: { recordId: string };
};

type Props = NativeStackScreenProps<ClinicalRecordsStackParamList, "ClinicalRecordsList">;

function ClinicalRecordRow({
  record,
  onPress,
}: {
  record: ClinicalRecordEntry;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open clinical record ${record.recordRef}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="document-text-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground"
              numberOfLines={1}
            >
              {record.patientName}
            </Text>
            <Chip
              label={ENCOUNTER_TYPE_LABELS[record.encounterType]}
              variant={ENCOUNTER_TYPE_CHIP_VARIANT[record.encounterType]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {record.recordName} · {formatRecordDate(record.date)}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {record.recordRef} · {record.doctor}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Chip
            label={LOCK_STATUS_LABELS[record.lockStatus]}
            variant={LOCK_STATUS_CHIP_VARIANT[record.lockStatus]}
          />
        </View>
      </Card>
    </Pressable>
  );
}

export function ClinicalRecordsListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [encounterType, setEncounterType] = useState<"all" | ClinicalRecordEncounterType>("all");

  const { data, totalCount } = useClinicalRecordsList({
    search: query,
    encounterType,
  });

  const headerSubtitle = useMemo(() => {
    if (query.length === 0 && encounterType === "all") {
      return `${data.length} of ${totalCount} records`;
    }
    return `${data.length} match${data.length === 1 ? "" : "es"}`;
  }, [data.length, query.length, encounterType, totalCount]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search patient, record, or ref"
      />
      <FilterBar
        options={CLINICAL_RECORDS_FILTER_OPTIONS}
        value={encounterType}
        onChange={(id) => setEncounterType(id as "all" | ClinicalRecordEncounterType)}
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
              Clinical Records
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ClinicalRecordRow
            record={item}
            onPress={() =>
              navigation.navigate("ClinicalRecordsDetail", { recordId: item.id })
            }
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No clinical records found"
            message={
              query.length > 0
                ? "Try a different search or encounter filter."
                : "Consultation notes, discharge summaries, and reports across encounters will appear here."
            }
          />
        }
      />
    </View>
  );
}
