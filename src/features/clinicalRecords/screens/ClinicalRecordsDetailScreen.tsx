import React, { useLayoutEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
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
  DEMO_CLINICAL_RECORDS_QUICK_STATS,
  ENCOUNTER_TYPE_CHIP_VARIANT,
  ENCOUNTER_TYPE_LABELS,
  formatRecordDate,
  LOCK_STATUS_CHIP_VARIANT,
  LOCK_STATUS_LABELS,
} from "../constants";
import { useClinicalRecord } from "../hooks";
import type { ClinicalRecordsStackParamList } from "./ClinicalRecordsListScreen";

type Props = NativeStackScreenProps<ClinicalRecordsStackParamList, "ClinicalRecordsDetail">;

export function ClinicalRecordsDetailScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: record, isLoading } = useClinicalRecord(recordId);

  useLayoutEffect(() => {
    if (record) {
      navigation.setOptions({
        title: record.recordRef,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={LOCK_STATUS_LABELS[record.lockStatus]}
              variant={LOCK_STATUS_CHIP_VARIANT[record.lockStatus]}
            />
          </View>
        ),
      });
    }
  }, [navigation, record]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!record) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">
          Record not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The clinical record may have been removed. Try going back to the
          list.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Identity header — Avatar + name + KeyValueRow summary */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={record.patientName} size="lg" />
            <View className="flex-1 gap-1">
              <Text
                className="text-base font-semibold text-foreground"
                numberOfLines={1}
              >
                {record.patientName}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {record.patientId} · {record.recordRef}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip
                  label={ENCOUNTER_TYPE_LABELS[record.encounterType]}
                  variant={ENCOUNTER_TYPE_CHIP_VARIANT[record.encounterType]}
                />
                <Chip
                  label={LOCK_STATUS_LABELS[record.lockStatus]}
                  variant={LOCK_STATUS_CHIP_VARIANT[record.lockStatus]}
                />
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Record" value={record.recordName} />
            <KeyValueRow label="Date" value={formatRecordDate(record.date)} />
            <KeyValueRow
              label="Encounter"
              value={`${ENCOUNTER_TYPE_LABELS[record.encounterType]} · ${record.encounterRef}`}
              action={{ icon: "open-outline", onPress: () => {}, label: "Open encounter" }}
            />
            <KeyValueRow label="Recorded by" value={record.doctor} />
          </View>
        </Card>
      </View>

      {/* Quick stats — 2x2 grid of aggregate numbers */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile
              icon="document-text-outline"
              label="Total records"
              value={String(DEMO_CLINICAL_RECORDS_QUICK_STATS.totalRecords)}
              tint="blue"
              hint="Across all encounters"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="lock-closed-outline"
              label="Locked"
              value={String(DEMO_CLINICAL_RECORDS_QUICK_STATS.lockedThisWeek)}
              tint="emerald"
              hint="Finalised this week"
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="create-outline"
              label="Drafts"
              value={String(DEMO_CLINICAL_RECORDS_QUICK_STATS.draftRecords)}
              tint="amber"
              hint="Awaiting lock"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="pencil-outline"
              label="Edited today"
              value={String(DEMO_CLINICAL_RECORDS_QUICK_STATS.editedToday)}
              tint="violet"
              hint="Across all doctors"
            />
          </View>
        </View>
      </View>

      {/* Field values — read-only flat rendering, not the full form renderer */}
      <View>
        <SectionHeader
          title="Record contents"
          count={`${record.fieldValues.length} field${record.fieldValues.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              {record.fieldValues.map((field, i) => (
                <View key={`${field.label}-${i}`}>
                  <View className="px-1 py-2.5">
                    <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {field.label}
                    </Text>
                    <Text className="mt-1 text-sm text-foreground">
                      {field.value}
                    </Text>
                  </View>
                  {i < record.fieldValues.length - 1 ? (
                    <View className="h-px bg-border/60" />
                  ) : null}
                </View>
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* Edit / audit timeline */}
      <View>
        <SectionHeader
          title="Edit & audit trail"
          count={`${record.auditTimeline.length} event${record.auditTimeline.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {record.auditTimeline.map((event, i) => (
                <TimelineRow
                  key={`${event.title}-${i}`}
                  title={event.title}
                  subtitle={event.subtitle}
                  when={event.when}
                  tint={event.tint}
                  icon={event.icon}
                  isLast={i === record.auditTimeline.length - 1}
                />
              ))}
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
