import React, { useLayoutEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  Input,
  KeyValueRow,
  SectionHeader,
  SkeletonList,
  useToast,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useAuth } from "../../../store/AuthContext";
import { formatDate, formatTenure, staffDisplayName } from "../constants";
import { useDeactivateStaff, useDeleteStaff, useStaffMember } from "../hooks";
import type { AdminStackParamList } from "./AdminListScreen";

type Props = NativeStackScreenProps<AdminStackParamList, "AdminDetail">;

export function AdminDetailScreen({ route, navigation }: Props) {
  const { staffId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { can, session } = useAuth();
  const canManage = can("admin.full_access.enabled");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { data: staff, isLoading, isError, refetch } = useStaffMember(staffId);
  const deactivate = useDeactivateStaff();
  const deleteStaff = useDeleteStaff();

  const name = staff ? staffDisplayName(staff) : "";

  useLayoutEffect(() => {
    if (staff) {
      navigation.setOptions({
        title: name,
        headerRight: () =>
          canManage ? (
            <View className="pr-1">
              <Chip
                label={staff.is_active ? "Active" : "Inactive"}
                variant={staff.is_active ? "success" : "neutral"}
              />
            </View>
          ) : null,
      });
    }
  }, [navigation, staff, name, canManage]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <SkeletonList rows={6} />
      </View>
    );
  }

  if (isError || !staff) {
    return (
      <View className="flex-1 bg-background px-4 pt-8">
        <EmptyState
          icon="alert-circle-outline"
          title="Staff member not found"
          message="The account may have been removed, or the request failed. Try again."
          action={<Button title="Retry" onPress={() => refetch()} fullWidth={false} />}
        />
      </View>
    );
  }

  const isSelf = staff.id === session?.userId;

  function handleToggleActive() {
    if (!staff) return;
    deactivate.mutate(
      { id: staff.id, isActive: !staff.is_active },
      {
        onSuccess: () => toast.show(staff.is_active ? "Staff member deactivated" : "Staff member reactivated", "success"),
        onError: () => toast.show("Couldn't update the account", "error"),
      }
    );
  }

  function handleConfirmDelete() {
    if (!staff || confirmText.trim().toLowerCase() !== staff.email.toLowerCase()) return;
    deleteStaff.mutate(staff.id, {
      onSuccess: () => {
        toast.show("Staff member deleted", "success");
        setConfirmOpen(false);
        navigation.goBack();
      },
      onError: () => toast.show("Couldn't delete the account", "error"),
    });
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: (canManage ? 96 : 24) + TAB_BAR_CONTENT_INSET + insets.bottom,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity header */}
        <View className="px-4 pt-4">
          <Card padded={false}>
            <View className="flex-row items-center gap-3 p-4">
              <Avatar source={name} size="lg" />
              <View className="flex-1 gap-1">
                <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                  {name}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {staff.email}
                </Text>
                <View className="flex-row items-center gap-1.5 pt-1 flex-wrap">
                  <Chip label={staff.is_active ? "Active" : "Inactive"} variant={staff.is_active ? "success" : "neutral"} />
                  {staff.is_super_admin ? <Chip label="Super Admin" variant="info" /> : null}
                  {isSelf ? <Chip label="You" variant="neutral" /> : null}
                </View>
              </View>
            </View>
            <View className="border-t border-border/60 px-1">
              <KeyValueRow label="Phone" value={staff.phone || "—"} />
              <KeyValueRow label="Timezone" value={staff.timezone || "—"} />
              <KeyValueRow label="Joined" value={formatDate(staff.date_joined)} />
              <KeyValueRow label="Tenure" value={formatTenure(staff.date_joined)} />
            </View>
          </Card>
        </View>

        {/* Roles */}
        <View>
          <SectionHeader title="Roles" count={staff.roles.length} />
          <View className="px-4">
            <Card>
              {staff.roles.length === 0 ? (
                <Text className="text-sm text-muted-foreground">No roles assigned.</Text>
              ) : (
                <View className="gap-3">
                  {staff.roles.map((role) => (
                    <View key={role.id} className="flex-row items-center justify-between gap-2">
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                          {role.name}
                        </Text>
                        {role.description ? (
                          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                            {role.description}
                          </Text>
                        ) : null}
                      </View>
                      <Chip label={role.is_active ? "Active" : "Inactive"} variant={role.is_active ? "success" : "neutral"} />
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </View>
        </View>

        {/* Account info */}
        <View>
          <SectionHeader title="Account" />
          <View className="px-4">
            <Card padded={false}>
              <View className="px-1">
                <KeyValueRow label="Tenant" value={staff.tenant_name || "—"} />
                <KeyValueRow label="User ID" value={staff.id} />
              </View>
            </Card>
            <Text className="mt-2 text-xs text-muted-foreground">
              No department, last-login, or invite-status fields exist for this account on the
              backend — only what's shown here is real.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky action footer — write actions gated on admin.full_access.enabled */}
      {canManage ? (
        <View className="border-t border-border bg-card px-4 pt-3 gap-2" style={{ paddingBottom: insets.bottom + 12 }}>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                title="Edit"
                variant="outline"
                onPress={() => navigation.navigate("NewStaff", { staffId: staff.id })}
                icon={<Ionicons name="create-outline" size={16} color="#0f172a" />}
              />
            </View>
            <View className="flex-1">
              <Button
                title={staff.is_active ? "Deactivate" : "Reactivate"}
                variant={staff.is_active ? "secondary" : "primary"}
                onPress={handleToggleActive}
                loading={deactivate.isPending}
                disabled={isSelf}
                icon={
                  <Ionicons
                    name={staff.is_active ? "person-remove-outline" : "person-add-outline"}
                    size={16}
                    color={staff.is_active ? "#0f172a" : "#ffffff"}
                  />
                }
              />
            </View>
          </View>
          <Button
            title="Delete account"
            variant="destructive"
            onPress={() => {
              setConfirmText("");
              setConfirmOpen(true);
            }}
            disabled={isSelf}
            icon={<Ionicons name="trash-outline" size={16} color="#ffffff" />}
          />
          {isSelf ? (
            <Text className="text-center text-[11px] text-muted-foreground">
              You can't deactivate or delete your own account from here.
            </Text>
          ) : null}
        </View>
      ) : null}

      <BottomSheet visible={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete staff account">
        <View className="gap-3 pb-2">
          <Text className="text-sm text-muted-foreground">
            This permanently deletes {name}'s account. This can't be undone, and the backend has
            no safety net (no active-session check, no "last admin" guard). Type{" "}
            <Text className="font-mono text-foreground">{staff.email}</Text> to confirm.
          </Text>
          <Input
            placeholder={staff.email}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            title="Permanently delete"
            variant="destructive"
            onPress={handleConfirmDelete}
            loading={deleteStaff.isPending}
            disabled={confirmText.trim().toLowerCase() !== staff.email.toLowerCase()}
          />
        </View>
      </BottomSheet>
    </View>
  );
}
