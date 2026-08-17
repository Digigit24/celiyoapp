import React, { useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Avatar, Card, Chip, EmptyState, SearchHeader, FilterBar, SkeletonList, Button } from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import type { StaffUser } from "../../../types/admin";
import {
  STAFF_FILTER_OPTIONS,
  STAFF_STATUS_CHIP_VARIANT,
  STAFF_STATUS_LABELS,
  staffDisplayName,
  type StaffStatusFilter,
} from "../constants";
import { useStaffList } from "../hooks";

/**
 * Param list for the Admin stack. The orchestrator owns the actual stack
 * registration; exporting the type here keeps the contract typed.
 */
export type AdminStackParamList = {
  AdminList: undefined;
  AdminDetail: { staffId: string };
  NewStaff: { staffId?: string } | undefined;
};

type Props = NativeStackScreenProps<AdminStackParamList, "AdminList">;

function StaffRow({ staff, onPress }: { staff: StaffUser; onPress: () => void }) {
  const name = staffDisplayName(staff);
  const status = staff.is_active ? "active" : "inactive";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open staff profile ${name}`}
      onPress={onPress}
      className="active:opacity-90"
    >
      <Card padded={false} className="flex-row items-center gap-3 p-3.5">
        <Avatar source={name} size="md" />
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[15px] font-semibold text-foreground flex-1" numberOfLines={1}>
              {name}
            </Text>
            <Chip label={STAFF_STATUS_LABELS[status]} variant={STAFF_STATUS_CHIP_VARIANT[status]} />
          </View>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {staff.roles.length > 0 ? staff.roles.map((r) => r.name).join(", ") : "No role assigned"}
          </Text>
          <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
            {staff.email}
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}

export function AdminListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { can } = useAuth();
  const canManage = can("admin.full_access.enabled");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StaffStatusFilter>("all");

  const { data, isLoading, isError, refetch, isFetching } = useStaffList();
  const allStaff = data?.results ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allStaff.filter((s) => {
      const isActive = s.is_active ? "active" : "inactive";
      if (status !== "all" && isActive !== status) return false;
      if (q.length === 0) return true;
      return (
        staffDisplayName(s).toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        s.roles.some((r) => r.name.toLowerCase().includes(q))
      );
    });
  }, [allStaff, query, status]);

  const headerSubtitle =
    query.trim().length === 0 && status === "all"
      ? `${filtered.length} of ${allStaff.length} staff`
      : `${filtered.length} match${filtered.length === 1 ? "" : "es"}`;

  return (
    <View className="flex-1 bg-background">
      <SearchHeader value={query} onChange={setQuery} placeholder="Search name, email, phone, or role" />
      <FilterBar
        options={STAFF_FILTER_OPTIONS}
        value={status}
        onChange={(id) => setStatus(id as StaffStatusFilter)}
      />

      {isLoading ? (
        <SkeletonList rows={8} />
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load staff"
          message="Check your connection and try again."
          action={<Button title="Retry" onPress={() => refetch()} fullWidth={false} />}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + (canManage ? 88 : 24),
            gap: 10,
          }}
          ListHeaderComponent={
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Staff accounts
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground/70">{headerSubtitle}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <StaffRow staff={item} onPress={() => navigation.navigate("AdminDetail", { staffId: item.id })} />
          )}
          ItemSeparatorComponent={() => <View className="h-2" />}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No staff found"
              message={query.length > 0 ? "Try a different search or status filter." : "Staff accounts will appear here."}
            />
          }
        />
      )}

      {canManage ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add staff member"
          onPress={() => navigation.navigate("NewStaff", undefined)}
          className="absolute right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-black/20 active:opacity-90"
          style={{ bottom: insets.bottom + TAB_BAR_CONTENT_INSET - 68 }}
        >
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      ) : null}
    </View>
  );
}
