import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Avatar, Card, Chip, EmptyState, SearchHeader, FilterBar } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  formatDate,
  STAFF_FILTER_OPTIONS,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_CHIP_VARIANT,
  STAFF_STATUS_LABELS,
  type StaffMember,
  type StaffStatus,
} from "../constants";
import { useStaffList } from "../hooks";

/**
 * Param list for the future Admin stack. The orchestrator owns the actual
 * stack registration; exporting the type here keeps the contract typed.
 */
export type AdminStackParamList = {
  AdminList: undefined;
  AdminDetail: { staffId: string };
};

type Props = NativeStackScreenProps<AdminStackParamList, "AdminList">;

function StaffRow({ staff, onPress }: { staff: StaffMember; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open staff profile ${staff.name}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <Avatar source={staff.name} size="md" />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text
              className="text-[15px] font-semibold text-foreground flex-1"
              numberOfLines={1}
            >
              {staff.name}
            </Text>
            <Chip
              label={STAFF_STATUS_LABELS[staff.status]}
              variant={STAFF_STATUS_CHIP_VARIANT[staff.status]}
            />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {STAFF_ROLE_LABELS[staff.role]} · {staff.department}
          </Text>
          <Text className="font-mono text-[10px] text-muted-foreground" numberOfLines={1}>
            {staff.employeeId} · Last active {formatDate(staff.lastActiveDate)}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function AdminListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | StaffStatus>("all");

  const { data, totalCount } = useStaffList({ search: query, status });

  const headerSubtitle = useMemo(() => {
    if (query.length === 0 && status === "all") {
      return `${data.length} of ${totalCount} staff`;
    }
    return `${data.length} match${data.length === 1 ? "" : "es"}`;
  }, [data.length, query.length, status, totalCount]);

  return (
    <View className="flex-1 bg-background">
      <SearchHeader
        value={query}
        onChange={setQuery}
        placeholder="Search name, employee id, or department"
      />
      <FilterBar
        options={STAFF_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as "all" | StaffStatus)}
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
              Staff accounts
            </Text>
            <Text className="text-[11px] font-semibold text-muted-foreground/70">
              {headerSubtitle}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <StaffRow
            staff={item}
            onPress={() => navigation.navigate("AdminDetail", { staffId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No staff found"
            message={
              query.length > 0
                ? "Try a different search or status filter."
                : "Staff accounts will appear here."
            }
          />
        }
      />
    </View>
  );
}
