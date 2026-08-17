import React, { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar, Card, EmptyState, SearchHeader, SkeletonList } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import type { MrdWorklistItem } from "../../../types/mrd";
import { useMrdWorklist } from "../hooks";

/**
 * Param list for the MRD stack. The orchestrator owns the actual stack
 * registration; exporting the type here keeps the contract typed.
 */
export type MrdStackParamList = {
  MrdList: undefined;
  MrdDetail: { patientId: number; patientName?: string };
};

type Props = NativeStackScreenProps<MrdStackParamList, "MrdList">;

function WorklistRow({ item, onPress }: { item: MrdWorklistItem; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.patient_name}'s dossier`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <Avatar source={item.patient_name} size="md" />
        <View className="flex-1 gap-1">
          <Text className="text-[15px] font-semibold text-foreground" numberOfLines={1}>
            {item.patient_name}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {item.gender} · {item.age != null ? `${item.age}y` : "—"} · {item.mobile}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {item.patient_id_display}
          </Text>
        </View>
        <Text className="text-muted-foreground">›</Text>
      </Card>
    </Pressable>
  );
}

/** 280ms debounce — search hits the server (`GET /mrd/worklist?search=`), unlike Admin's client-side filter. */
function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function MrdListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 280);

  const { data, isLoading, isError, refetch, isFetching } = useMrdWorklist(debouncedQuery);
  const items = data ?? [];

  const headerSubtitle =
    query.trim().length > 0
      ? `${items.length} match${items.length === 1 ? "" : "es"}`
      : `${items.length} recently updated`;

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search patient name or patient ID"
      />

      {isLoading ? (
        <SkeletonList rows={8} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.patient_id)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
            gap: 10,
          }}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                MRD Worklist
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground/70">
                {headerSubtitle}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <WorklistRow
              item={item}
              onPress={() =>
                navigation.navigate("MrdDetail", {
                  patientId: item.patient_id,
                  patientName: item.patient_name,
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            isError ? (
              <EmptyState
                icon="alert-circle-outline"
                title="Couldn't load the worklist"
                message="Check your connection and try again."
              />
            ) : (
              <EmptyState
                icon="folder-open-outline"
                title="No patients found"
                message={
                  query.length > 0
                    ? "Try a different name or patient ID."
                    : "Patients with recent activity will appear here."
                }
              />
            )
          }
        />
      )}
    </View>
  );
}
