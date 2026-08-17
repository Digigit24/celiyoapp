import React, { useLayoutEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  KeyValueRow,
  SectionHeader,
  SkeletonList,
  StatTile,
  useToast,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { downloadAndShareMrdExport } from "../../../lib/api/mrd";
import type { MrdEncounter, MrdEncounterType, MrdManifestItem, MrdSessionExport } from "../../../types/mrd";
import { MRD_ENCOUNTER_CHIP_VARIANT, MRD_ENCOUNTER_LABELS, formatMrdDate } from "../constants";
import { useCreateMrdExport, useMrdDossier } from "../hooks";
import type { MrdStackParamList } from "./MrdListScreen";

type Props = NativeStackScreenProps<MrdStackParamList, "MrdDetail">;

const SOURCE_ICON: Record<MrdManifestItem["source_type"], keyof typeof Ionicons.glyphMap> = {
  clinical_record: "document-text-outline",
  admission: "bed-outline",
};

function ManifestRow({
  item,
  checked,
  onToggle,
}: {
  item: MrdManifestItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={item.title}
      onPress={onToggle}
      className="flex-row items-center gap-3 px-1 py-3 active:opacity-70"
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={22}
        color={checked ? "#2563eb" : "#94a3b8"}
      />
      <View className="h-8 w-8 items-center justify-center rounded-full bg-secondary">
        <Ionicons name={SOURCE_ICON[item.source_type]} size={16} color="#0f172a" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-medium text-foreground" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {item.category} · {formatMrdDate(item.created_at)}
          {item.required ? " · Required" : ""}
        </Text>
      </View>
    </Pressable>
  );
}

export function MrdDetailScreen({ route, navigation }: Props) {
  const { patientId, patientName } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [encounterFilter, setEncounterFilter] = useState<{ type: MrdEncounterType; id: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sessionExports, setSessionExports] = useState<MrdSessionExport[]>([]);

  const { data: dossier, isLoading, isError, refetch } = useMrdDossier(
    patientId,
    encounterFilter ? { encounter_type: encounterFilter.type, encounter_id: encounterFilter.id } : undefined
  );
  const createExport = useCreateMrdExport();

  useLayoutEffect(() => {
    navigation.setOptions({ title: patientName ?? dossier?.patient.patient_name ?? "Dossier" });
  }, [navigation, patientName, dossier]);

  const manifest = dossier?.manifest ?? [];

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleEncounter(encounter: MrdEncounter) {
    setSelectedIds(new Set());
    setEncounterFilter((prev) =>
      prev && prev.id === encounter.id && prev.type === encounter.type
        ? null
        : { type: encounter.type, id: encounter.id }
    );
  }

  async function handleGeneratePacket() {
    if (selectedIds.size === 0 || !dossier) return;
    try {
      const result = await createExport.mutateAsync({
        patient_id: dossier.patient.patient_id,
        item_ids: Array.from(selectedIds),
      });
      setSessionExports((prev) => [
        { id: result.id, status: result.status, itemCount: selectedIds.size, createdAt: Date.now() },
        ...prev,
      ]);
      if (result.status === "completed") {
        toast.show("Packet ready — downloading…", "success");
        await downloadAndShareMrdExport(result.id);
      } else {
        toast.show("Packet generation failed", "error");
      }
    } catch {
      toast.show("Couldn't generate the packet", "error");
    }
  }

  async function handleRedownload(exportId: string) {
    try {
      await downloadAndShareMrdExport(exportId);
    } catch {
      toast.show("Couldn't download that packet", "error");
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <SkeletonList rows={6} />
      </View>
    );
  }

  if (isError || !dossier) {
    return (
      <View className="flex-1 bg-background px-4 pt-8">
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load this dossier"
          message="The patient record may be unavailable. Try again."
          action={<Button title="Retry" onPress={() => refetch()} fullWidth={false} />}
        />
      </View>
    );
  }

  const { patient, encounters, completeness } = dossier;

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 96 + TAB_BAR_CONTENT_INSET + insets.bottom,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity header */}
        <View className="px-4 pt-4">
          <Card padded={false}>
            <View className="flex-row items-center gap-3 p-4">
              <Avatar source={patient.patient_name} size="lg" />
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                  {patient.patient_name}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {patient.patient_id_display} · {patient.gender} · {patient.age != null ? `${patient.age}y` : "—"}
                </Text>
              </View>
            </View>
            <View className="border-t border-border/60 px-1">
              <KeyValueRow label="Mobile" value={patient.mobile || "—"} />
            </View>
          </Card>
        </View>

        {/* Completeness stats */}
        <View className="px-4">
          <View className="flex-row gap-2">
            <View className="flex-1">
              <StatTile
                icon="checkmark-done-circle-outline"
                label="Packet completeness"
                value={`${completeness.percent}%`}
                tint={completeness.percent >= 100 ? "emerald" : "amber"}
                hint={`${completeness.ready} of ${completeness.total} documents ready`}
              />
            </View>
            <View className="flex-1">
              <StatTile
                icon="checkbox-outline"
                label="Selected for export"
                value={selectedIds.size}
                tint="blue"
                hint={`${manifest.length} available`}
              />
            </View>
          </View>
        </View>

        {/* Encounters */}
        <View>
          <SectionHeader title="Encounters" count={encounters.length} />
          <View className="px-4">
            {encounters.length === 0 ? (
              <Card>
                <Text className="text-sm text-muted-foreground">No encounters on record.</Text>
              </Card>
            ) : (
              <View className="flex-row flex-wrap gap-1.5">
                <Pressable onPress={() => setEncounterFilter(null)} accessibilityRole="button">
                  <Chip
                    label="All"
                    variant={encounterFilter === null ? "info" : "neutral"}
                  />
                </Pressable>
                {encounters.map((enc) => {
                  const active = encounterFilter?.id === enc.id && encounterFilter?.type === enc.type;
                  return (
                    <Pressable
                      key={`${enc.type}-${enc.id}`}
                      onPress={() => toggleEncounter(enc)}
                      accessibilityRole="button"
                    >
                      <Chip
                        label={`${MRD_ENCOUNTER_LABELS[enc.type]} · ${enc.label}`}
                        variant={active ? "info" : MRD_ENCOUNTER_CHIP_VARIANT[enc.type]}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Document checklist */}
        <View>
          <SectionHeader
            title="Document checklist"
            count={`${manifest.length} item${manifest.length === 1 ? "" : "s"}`}
            right={
              manifest.length > 0
                ? {
                    label: selectedIds.size === manifest.length ? "Clear all" : "Select all",
                    onPress: () =>
                      setSelectedIds(
                        selectedIds.size === manifest.length ? new Set() : new Set(manifest.map((m) => m.id))
                      ),
                  }
                : undefined
            }
          />
          <View className="px-4">
            <Card padded={false}>
              {manifest.length === 0 ? (
                <View className="p-4">
                  <EmptyState
                    size="sm"
                    icon="document-outline"
                    title="No documents available"
                    message="Nothing ready to include in a packet yet."
                  />
                </View>
              ) : (
                <View className="px-3">
                  {manifest.map((item) => (
                    <ManifestRow
                      key={item.id}
                      item={item}
                      checked={selectedIds.has(item.id)}
                      onToggle={() => toggleItem(item.id)}
                    />
                  ))}
                </View>
              )}
            </Card>
          </View>
        </View>

        {/* Session export history — client-side only, no server history endpoint exists */}
        {sessionExports.length > 0 ? (
          <View>
            <SectionHeader title="Exports this session" count={sessionExports.length} />
            <View className="px-4">
              <Card padded={false}>
                <View className="px-1">
                  {sessionExports.map((exp) => (
                    <View
                      key={exp.id}
                      className="flex-row items-center justify-between gap-3 py-2.5 px-3 border-b border-border/60 last:border-b-0"
                    >
                      <View className="flex-1 gap-0.5">
                        <View className="flex-row items-center gap-2">
                          <Chip
                            label={exp.status === "completed" ? "Ready" : "Failed"}
                            variant={exp.status === "completed" ? "success" : "danger"}
                          />
                          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                            {exp.itemCount} doc{exp.itemCount === 1 ? "" : "s"}
                          </Text>
                        </View>
                      </View>
                      {exp.status === "completed" ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Download packet again"
                          onPress={() => handleRedownload(exp.id)}
                          hitSlop={8}
                          className="h-9 w-9 items-center justify-center rounded-full active:bg-muted"
                        >
                          <Ionicons name="download-outline" size={18} color="#2563eb" />
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky action footer */}
      <View
        className="border-t border-border bg-card px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          title={
            createExport.isPending
              ? "Generating…"
              : `Generate PDF Packet${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`
          }
          onPress={handleGeneratePacket}
          disabled={selectedIds.size === 0}
          loading={createExport.isPending}
          icon={<Ionicons name="document-attach-outline" size={18} color="#ffffff" />}
        />
      </View>
    </View>
  );
}
