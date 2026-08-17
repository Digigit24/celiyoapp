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
  formatMrdDate,
  MRD_FILTER_OPTIONS,
  MRD_STATUS_CHIP_VARIANT,
  MRD_STATUS_LABELS,
  type MrdFileRecord,
  type MrdFileStatus,
} from "../constants";
import { useMrdList } from "../hooks";

/**
 * Param list for the future MRD stack. The orchestrator owns the actual
 * stack registration; exporting the type here keeps the contract typed.
 */
export type MrdStackParamList = {
  MrdList: undefined;
  MrdDetail: { fileId: string };
};

type Props = NativeStackScreenProps<MrdStackParamList, "MrdList">;

function MrdRow({
  file,
  onPress,
}: {
  file: MrdFileRecord;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open file ${file.fileNumber}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <Ionicons name="folder-outline" size={18} color="#0f172a" />
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground"
              numberOfLines={1}
            >
              {file.patientName}
            </Text>
            <Chip
              label={MRD_STATUS_LABELS[file.status]}
              variant={MRD_STATUS_CHIP_VARIANT[file.status]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {file.currentCustody} · {formatMrdDate(file.lastMovementDate)}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {file.fileNumber} · {file.patientId}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
            {file.volumeCount} vol{file.volumeCount === 1 ? "" : "s"}
          </Text>
          <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
            {file.lastMovementTime}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function MrdListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | MrdFileStatus>("all");

  const { data, totalCount } = useMrdList({
    search: query,
    status,
  });

  const headerSubtitle = useMemo(() => {
    if (query.length === 0 && status === "all") {
      return `${data.length} of ${totalCount} files`;
    }
    return `${data.length} match${data.length === 1 ? "" : "es"}`;
  }, [data.length, query.length, status, totalCount]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search patient, file number, or custody"
      />
      <FilterBar
        options={MRD_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | MrdFileStatus)}
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
              MRD Files
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MrdRow
            file={item}
            onPress={() =>
              navigation.navigate("MrdDetail", { fileId: item.id })
            }
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon="folder-outline"
            title="No files found"
            message={
              query.length > 0
                ? "Try a different search or status filter."
                : "Patient file custody records will appear here."
            }
          />
        }
      />
    </View>
  );
}
