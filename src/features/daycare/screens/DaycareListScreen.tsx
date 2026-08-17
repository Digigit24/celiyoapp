import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Card, EmptyState, Input, FilterBar } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import {
  ADMISSION_STATUS_ACCENT,
  ADMISSION_STATUS_VARIANT,
  DAYCARE_FILTER_OPTIONS,
  DAYCARE_STATUS_LABELS,
  formatDaycareDate,
} from "../constants";
import { useDaycareList } from "../hooks";
import type { AdmissionListItem, AdmissionStatus } from "../../../types/ipd";

/**
 * Param list for the Daycare stack. The orchestrator owns the actual stack
 * registration; exporting the type here keeps the contract typed.
 */
export type DaycareStackParamList = {
  DaycareList: undefined;
  DaycareDetail: { sessionId: number };
  NewDaycareSession: undefined;
};

type Props = NativeStackScreenProps<DaycareStackParamList, "DaycareList">;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function DaycareRow({ session, onPress }: { session: AdmissionListItem; onPress: () => void }) {
  const accent = ADMISSION_STATUS_ACCENT[session.status];
  const subtitleParts = [
    session.admission_id,
    session.ward_name,
    session.bed_number ? `Bed ${session.bed_number}` : null,
  ].filter(Boolean);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="active:opacity-80">
      <Card padded={false} className="flex-row overflow-hidden">
        <View style={{ backgroundColor: accent.bar, width: 4 }} />
        <View className="flex-1 flex-row items-center gap-3 p-3.5">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-secondary">
            <Text className="text-sm font-bold text-secondary-foreground">
              {initials(session.patient_name)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {session.patient_name}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
              {subtitleParts.join(" · ")}
            </Text>
          </View>
          <View className="items-end gap-1.5">
            <View className="flex-row items-center gap-1">
              <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent.dot }} />
              <Badge
                label={DAYCARE_STATUS_LABELS[session.status]}
                variant={ADMISSION_STATUS_VARIANT[session.status]}
              />
            </View>
            <Text className="text-xs text-muted-foreground">
              {formatDaycareDate(session.admission_date)}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export function DaycareListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { can } = useAuth();
  const canCreate = can("hms.ipd.view");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AdmissionStatus>("admitted");

  const admissions = useDaycareList({
    search: query || undefined,
    status: status === "all" ? undefined : status,
    ordering: "-admission_date",
  });

  const results = admissions.data?.results ?? [];
  const headerSubtitle = useMemo(() => {
    if (!admissions.data) return "";
    return `${results.length} of ${admissions.data.count} session${admissions.data.count === 1 ? "" : "s"}`;
  }, [admissions.data, results.length]);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-3">
        <Input
          placeholder="Search patient or admission ID…"
          leftIcon="search-outline"
          value={query}
          onChangeText={setQuery}
        />
      </View>
      <View className="py-2">
        <FilterBar
          options={DAYCARE_FILTER_OPTIONS}
          value={status}
          onChange={(id) => setStatus(id as "all" | AdmissionStatus)}
        />
      </View>

      {admissions.isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
            gap: 10,
          }}
          ListHeaderComponent={
            headerSubtitle ? (
              <View className="flex-row items-center justify-end pb-2">
                <Text className="text-[11px] font-semibold text-muted-foreground/70">
                  {headerSubtitle}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <DaycareRow
              session={item}
              onPress={() => navigation.navigate("DaycareDetail", { sessionId: item.id })}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          ListEmptyComponent={
            <EmptyState
              icon="medkit-outline"
              title="No daycare sessions found"
              message={
                query.length > 0
                  ? "Try a different search or status filter."
                  : "Short-stay daycare admissions will appear here."
              }
            />
          }
        />
      )}

      {canCreate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New daycare session"
          onPress={() => navigation.navigate("NewDaycareSession")}
          className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-black/20 active:opacity-90"
          style={{ bottom: TAB_BAR_CONTENT_INSET + insets.bottom + 12 }}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      ) : null}
    </View>
  );
}
