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
  DAYCARE_FILTER_OPTIONS,
  DAYCARE_SESSION_TYPE_LABELS,
  DAYCARE_STATUS_CHIP_VARIANT,
  DAYCARE_STATUS_LABELS,
  formatDaycareDate,
  type DaycareSession,
  type DaycareSessionType,
  type DaycareStatus,
} from "../constants";
import { useDaycareList } from "../hooks";

/**
 * Param list for the future Daycare stack. The orchestrator owns the actual
 * stack registration; exporting the type here keeps the contract typed.
 */
export type DaycareStackParamList = {
  DaycareList: undefined;
  DaycareDetail: { sessionId: string };
};

type Props = NativeStackScreenProps<DaycareStackParamList, "DaycareList">;

const SESSION_TYPE_ICON: Record<DaycareSessionType, keyof typeof Ionicons.glyphMap> = {
  chemotherapy: "medkit-outline",
  dialysis: "water-outline",
  minor_procedure: "cut-outline",
  day_observation: "eye-outline",
  infusion_therapy: "flask-outline",
  physiotherapy: "body-outline",
};

function DaycareRow({
  session,
  onPress,
}: {
  session: DaycareSession;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open daycare session ${session.sessionRef}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons
            name={SESSION_TYPE_ICON[session.sessionType]}
            size={18}
            color="#0f172a"
          />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground"
              numberOfLines={1}
            >
              {session.patientName}
            </Text>
            <Chip
              label={DAYCARE_STATUS_LABELS[session.status]}
              variant={DAYCARE_STATUS_CHIP_VARIANT[session.status]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {DAYCARE_SESSION_TYPE_LABELS[session.sessionType]} · {formatDaycareDate(session.date)}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {session.sessionRef} · {session.bedOrChair}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text
            className="text-[13px] font-semibold text-foreground"
            numberOfLines={1}
          >
            {session.timeSlot}
          </Text>
          <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
            {session.attendingDoctor}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function DaycareListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | DaycareStatus>("all");

  const { data, totalCount } = useDaycareList({
    search: query,
    status,
  });

  const headerSubtitle = useMemo(() => {
    if (query.length === 0 && status === "all") {
      return `${data.length} of ${totalCount} sessions`;
    }
    return `${data.length} match${data.length === 1 ? "" : "es"}`;
  }, [data.length, query.length, status, totalCount]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search patient, ref, or session ID"
      />
      <FilterBar
        options={DAYCARE_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | DaycareStatus)}
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
              Daycare Sessions
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <DaycareRow
            session={item}
            onPress={() =>
              navigation.navigate("DaycareDetail", { sessionId: item.id })
            }
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
                : "Short-stay sessions like chemo, dialysis, and day observation will appear here."
            }
          />
        }
      />
    </View>
  );
}
