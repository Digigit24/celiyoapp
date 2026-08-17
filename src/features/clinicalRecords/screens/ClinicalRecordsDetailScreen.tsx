import React, { useLayoutEffect } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Button,
  Card,
  Chip,
  KeyValueRow,
  SectionHeader,
  TimelineRow,
  useToast,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  encounterTypeChipVariant,
  encounterTypeLabel,
  formatDateTime,
  renderFieldValues,
  STATUS_CHIP_VARIANT,
  STATUS_LABELS,
  truncateId,
} from "../constants";
import {
  useClinicalRecord,
  useCompleteRecord,
  useDeleteRecord,
  useLockRecord,
  useUnlockRecord,
} from "../hooks";
import type { ClinicalRecordsStackParamList } from "./ClinicalRecordsListScreen";

type Props = NativeStackScreenProps<ClinicalRecordsStackParamList, "ClinicalRecordsDetail">;

export function ClinicalRecordsDetailScreen({ route, navigation }: Props) {
  const { recordId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can } = useAuth();

  const { data: record, isLoading } = useClinicalRecord(recordId);
  const lockRecord = useLockRecord();
  const unlockRecord = useUnlockRecord();
  const completeRecord = useCompleteRecord();
  const deleteRecord = useDeleteRecord();

  const canEdit = can("hms.clinical.edit");
  const canDelete = can("hms.clinical.delete");

  useLayoutEffect(() => {
    if (record) {
      navigation.setOptions({
        title: record.form_name,
        headerRight: () => (
          <View className="pr-1">
            <Chip label={STATUS_LABELS[record.status]} variant={STATUS_CHIP_VARIANT[record.status]} />
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
        <Text className="text-base font-semibold text-foreground">Record not found</Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The clinical record may have been removed. Try going back to the list.
        </Text>
      </View>
    );
  }

  const fields = renderFieldValues(record);

  function handleLock() {
    lockRecord.mutate(record!.id, {
      onSuccess: () => toast.show("Record locked", "success"),
      onError: () => toast.show("Couldn't lock — it may already be locked", "error"),
    });
  }

  function handleUnlock() {
    unlockRecord.mutate(record!.id, {
      onSuccess: () => toast.show("Record unlocked", "success"),
      onError: () => toast.show("Couldn't unlock — it may not be locked", "error"),
    });
  }

  function handleComplete() {
    completeRecord.mutate(record!.id, {
      onSuccess: () => toast.show("Record marked complete", "success"),
      onError: () => toast.show("Couldn't mark the record complete", "error"),
    });
  }

  function handleDelete() {
    Alert.alert(
      "Delete this record?",
      "This is a permanent, hard delete — there's no undo and no soft-delete recovery.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteRecord.mutate(record!.id, {
              onSuccess: () => {
                toast.show("Record deleted", "success");
                navigation.goBack();
              },
              onError: () => toast.show("Couldn't delete the record", "error"),
            }),
        },
      ]
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
      {/* Identity header — no patient/doctor name on this resource; just the ids the API actually returns. */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="p-4 gap-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {record.form_name}
            </Text>
            <Text className="font-mono text-xs text-muted-foreground" numberOfLines={1}>
              {record.form_code} · v{record.version}
            </Text>
            <View className="flex-row items-center gap-1.5 pt-1">
              <Chip label={STATUS_LABELS[record.status]} variant={STATUS_CHIP_VARIANT[record.status]} />
              <Chip
                label={encounterTypeLabel(record.encounter_type)}
                variant={encounterTypeChipVariant(record.encounter_type)}
              />
              {record.is_locked ? <Chip label="Locked" variant="info" /> : null}
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Encounter" value={`${encounterTypeLabel(record.encounter_type)} #${record.encounter_id}`} />
            <KeyValueRow label="Patient" value={truncateId(record.patient_user_id)} />
            <KeyValueRow label="Created" value={formatDateTime(record.created_at)} />
            <KeyValueRow label="Updated" value={formatDateTime(record.updated_at)} />
            {record.is_locked ? (
              <>
                <KeyValueRow label="Locked by" value={truncateId(record.locked_by_user_id)} />
                <KeyValueRow label="Locked at" value={formatDateTime(record.locked_at)} />
              </>
            ) : null}
          </View>
        </Card>
      </View>

      {/* Field values — flat, read-only rendering (structure_snapshot + field_values join). */}
      <View>
        <SectionHeader title="Record contents" count={`${fields.length} field${fields.length === 1 ? "" : "s"}`} />
        <View className="px-4">
          <Card padded={false}>
            {fields.length === 0 ? (
              <Text className="p-4 text-sm text-muted-foreground">No field values recorded.</Text>
            ) : (
              <View className="px-1">
                {fields.map((field, i) => (
                  <View key={field.fieldKey}>
                    <View className="px-1 py-2.5">
                      <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {field.label}
                      </Text>
                      <Text className="mt-1 text-sm text-foreground">{field.value}</Text>
                    </View>
                    {i < fields.length - 1 ? <View className="h-px bg-border/60" /> : null}
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      </View>

      {/* History — just the timestamps the API actually gives us, no fabricated audit log. */}
      <View>
        <SectionHeader title="History" />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              <TimelineRow title="Created" when={formatDateTime(record.created_at)} tint="slate" icon="add-circle" />
              {record.updated_at !== record.created_at ? (
                <TimelineRow
                  title="Last updated"
                  when={formatDateTime(record.updated_at)}
                  tint="blue"
                  icon="pencil"
                />
              ) : null}
              <TimelineRow
                title={record.is_locked ? "Locked" : "Not locked"}
                subtitle={record.is_locked ? `By ${truncateId(record.locked_by_user_id)}` : undefined}
                when={record.is_locked ? formatDateTime(record.locked_at) : undefined}
                tint={record.is_locked ? "emerald" : "slate"}
                icon={record.is_locked ? "lock-closed" : "lock-open"}
                isLast
              />
            </View>
          </Card>
        </View>
      </View>

      {/* Actions */}
      {canEdit || canDelete ? (
        <View className="px-4 gap-2">
          {canEdit ? (
            record.is_locked ? (
              <Button title="Unlock record" variant="secondary" onPress={handleUnlock} loading={unlockRecord.isPending} />
            ) : (
              <Button title="Lock record" variant="secondary" onPress={handleLock} loading={lockRecord.isPending} />
            )
          ) : null}
          {canEdit && record.status !== "completed" ? (
            <Button title="Mark complete" onPress={handleComplete} loading={completeRecord.isPending} />
          ) : null}
          {canDelete && !record.is_locked ? (
            <Button title="Delete record" variant="destructive" onPress={handleDelete} loading={deleteRecord.isPending} />
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}
