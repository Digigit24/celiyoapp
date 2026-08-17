import React, { useLayoutEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
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
  daysSince,
  formatDate,
  formatTenure,
  STAFF_ROLE_LABELS,
  STAFF_STATUS_CHIP_VARIANT,
  STAFF_STATUS_LABELS,
} from "../constants";
import { useStaffMember } from "../hooks";
import type { AdminStackParamList } from "./AdminListScreen";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminDetail">;

export function AdminDetailScreen({ route, navigation }: Props) {
  const { staffId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: staff, isLoading } = useStaffMember(staffId);

  useLayoutEffect(() => {
    if (staff) {
      navigation.setOptions({
        title: staff.employeeId,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={STAFF_STATUS_LABELS[staff.status]}
              variant={STAFF_STATUS_CHIP_VARIANT[staff.status]}
            />
          </View>
        ),
      });
    }
  }, [navigation, staff]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!staff) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">
          Staff member not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The account may have been removed. Try going back to the list.
        </Text>
      </View>
    );
  }

  const lastActiveDaysAgo = daysSince(staff.lastActiveDate);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Identity header */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={staff.name} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {staff.name}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {STAFF_ROLE_LABELS[staff.role]} · {staff.employeeId}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip
                  label={STAFF_STATUS_LABELS[staff.status]}
                  variant={STAFF_STATUS_CHIP_VARIANT[staff.status]}
                />
                <Chip label={staff.department} variant="neutral" />
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Email" value={staff.email} />
            <KeyValueRow label="Phone" value={staff.phone} />
            <KeyValueRow label="Joined" value={formatDate(staff.joinedDate)} />
          </View>
        </Card>
      </View>

      {/* Quick stats */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile
              icon="shield-checkmark-outline"
              label="Modules granted"
              value={staff.permissions.length}
              tint="blue"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="briefcase-outline"
              label="Tenure"
              value={formatTenure(staff.joinedDate)}
              tint="emerald"
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="time-outline"
              label="Last active"
              value={lastActiveDaysAgo <= 0 ? "Today" : `${lastActiveDaysAgo}d ago`}
              tint={lastActiveDaysAgo > 14 ? "amber" : "slate"}
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="git-branch-outline"
              label="Activity events"
              value={staff.timeline.length}
              tint="violet"
            />
          </View>
        </View>
      </View>

      {/* Contact / info */}
      <View>
        <SectionHeader title="Contact & info" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="Department" value={staff.department} />
              <KeyValueRow label="Role" value={STAFF_ROLE_LABELS[staff.role]} />
              <KeyValueRow
                label="Email"
                value={staff.email}
                action={{ icon: "mail-outline", onPress: () => {}, label: "Email staff" }}
              />
              <KeyValueRow
                label="Phone"
                value={staff.phone}
                action={{ icon: "call-outline", onPress: () => {}, label: "Call staff" }}
              />
            </View>
          </Card>
        </View>
      </View>

      {/* Permissions summary — read-only module access grants */}
      <View>
        <SectionHeader
          title="Module access"
          count={`${staff.permissions.length} module${staff.permissions.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card>
            <View className="flex-row flex-wrap gap-1.5">
              {staff.permissions.map((moduleLabel) => (
                <Chip key={moduleLabel} label={moduleLabel} variant="info" />
              ))}
            </View>
            <Text className="mt-3 text-xs text-muted-foreground">
              Read-only here. Granting or revoking module access happens on
              the web admin panel.
            </Text>
          </Card>
        </View>
      </View>

      {/* Activity timeline */}
      <View>
        <SectionHeader
          title="Account activity"
          count={`${staff.timeline.length} event${staff.timeline.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {staff.timeline.map((event, i) => (
                <TimelineRow
                  key={`${event.title}-${i}`}
                  title={event.title}
                  subtitle={event.subtitle}
                  when={event.when}
                  tint={event.tint}
                  icon={event.icon}
                  isLast={i === staff.timeline.length - 1}
                />
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* Phase 3 nudge — honest "coming soon" footer for live actions */}
      <View className="px-4">
        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-50">
              <Ionicons name="construct-outline" size={18} color="#92400e" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Account management arrives in Phase 3
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                Editing roles, resending invites, and deactivating accounts
                ship with the Phase 3 admin integration. Auth and permissions
                are already wired.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
