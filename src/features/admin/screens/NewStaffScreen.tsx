import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, FormField, Input, InlineError, SkeletonList, useToast } from "../../../components/ui";
import { generatePassword } from "../constants";
import { useCreateStaff, useRoles, useStaffMember, useUpdateStaff } from "../hooks";
import type { AdminStackParamList } from "./AdminListScreen";

type Props = NativeStackScreenProps<AdminStackParamList, "NewStaff">;

interface FormState {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  password_confirm: string;
  role_ids: string[];
}

const BLANK: FormState = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  password: "",
  password_confirm: "",
  role_ids: [],
};

export function NewStaffScreen({ route, navigation }: Props) {
  const staffId = route.params?.staffId;
  const isEdit = Boolean(staffId);
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const { data: existing, isLoading: loadingExisting } = useStaffMember(staffId);
  const roles = useRoles();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();

  const [form, setForm] = useState<FormState>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? "Edit staff" : "Add staff" });
  }, [navigation, isEdit]);

  // Prefill once the existing record loads, in edit mode.
  useEffect(() => {
    if (isEdit && existing) {
      setForm((prev) => ({
        ...prev,
        email: existing.email,
        first_name: existing.first_name,
        last_name: existing.last_name,
        phone: existing.phone ?? "",
        role_ids: existing.roles.map((r) => r.id),
      }));
    }
  }, [isEdit, existing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleRole(id: string) {
    setForm((prev) => ({
      ...prev,
      role_ids: prev.role_ids.includes(id) ? prev.role_ids.filter((r) => r !== id) : [...prev.role_ids, id],
    }));
  }

  function handleGeneratePassword() {
    const pwd = generatePassword();
    setForm((prev) => ({ ...prev, password: pwd, password_confirm: pwd }));
    setShowPassword(true);
  }

  function validate(): string | null {
    if (!form.email.trim() || !form.email.includes("@")) return "Enter a valid email address";
    if (!isEdit) {
      if (!form.password) return "Set a password for this account";
      if (form.password.length < 8) return "Password must be at least 8 characters";
      if (form.password !== form.password_confirm) return "Passwords don't match";
    }
    return null;
  }

  function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (isEdit && staffId) {
      updateStaff.mutate(
        {
          id: staffId,
          payload: {
            email: form.email.trim(),
            first_name: form.first_name.trim() || undefined,
            last_name: form.last_name.trim() || undefined,
            phone: form.phone.trim() || undefined,
            role_ids: form.role_ids,
          },
        },
        {
          onSuccess: () => {
            toast.show("Staff account updated", "success");
            navigation.goBack();
          },
          onError: () => toast.show("Couldn't update the account", "error"),
        }
      );
      return;
    }

    createStaff.mutate(
      {
        email: form.email.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        first_name: form.first_name.trim() || undefined,
        last_name: form.last_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role_ids: form.role_ids,
      },
      {
        onSuccess: (staff) => {
          toast.show("Staff account created", "success");
          navigation.replace("AdminDetail", { staffId: staff.id });
        },
        onError: () => toast.show("Couldn't create the account", "error"),
      }
    );
  }

  if (isEdit && loadingExisting) {
    return <SkeletonList rows={6} />;
  }

  const isPending = createStaff.isPending || updateStaff.isPending;

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
        <FormField label="Email" required helper={isEdit ? "Editable, but there's no re-verification step on change." : undefined}>
          <Input
            value={form.email}
            onChangeText={(v) => set("email", v)}
            placeholder="name@hospital.in"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
        </FormField>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField label="First name">
              <Input value={form.first_name} onChangeText={(v) => set("first_name", v)} />
            </FormField>
          </View>
          <View className="flex-1">
            <FormField label="Last name">
              <Input value={form.last_name} onChangeText={(v) => set("last_name", v)} />
            </FormField>
          </View>
        </View>

        <FormField label="Phone">
          <Input value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" />
        </FormField>

        {!isEdit ? (
          <View className="gap-3">
            <FormField
              label="Password"
              required
              helper="No invite-email flow exists — set a real password now. Shown in plain text only until you leave this screen."
            >
              <Input
                value={form.password}
                onChangeText={(v) => set("password", v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </FormField>
            <FormField label="Confirm password" required>
              <Input
                value={form.password_confirm}
                onChangeText={(v) => set("password_confirm", v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </FormField>
            <Pressable
              accessibilityRole="button"
              onPress={handleGeneratePassword}
              className="flex-row items-center gap-1.5 self-start active:opacity-70"
            >
              <Ionicons name="refresh-outline" size={14} color="#2563eb" />
              <Text className="text-[13px] font-semibold text-primary">Generate a strong password</Text>
            </Pressable>
            {form.password ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowPassword((v) => !v)}
                className="flex-row items-center gap-1.5 self-start active:opacity-70"
              >
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={14} color="#64748b" />
                <Text className="text-[13px] font-medium text-muted-foreground">
                  {showPassword ? "Hide password" : "Show password — save it now, it won't be shown again"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <FormField label="Roles" helper="Toggle every role this account should have.">
          <Card>
            {roles.isLoading ? (
              <Text className="text-sm text-muted-foreground">Loading roles…</Text>
            ) : (roles.data?.results ?? []).length === 0 ? (
              <Text className="text-sm text-muted-foreground">No roles exist yet for this tenant.</Text>
            ) : (
              <View className="flex-row flex-wrap gap-1.5">
                {(roles.data?.results ?? []).map((role) => {
                  const selected = form.role_ids.includes(role.id);
                  return (
                    <Pressable key={role.id} accessibilityRole="button" onPress={() => toggleRole(role.id)}>
                      <Chip
                        label={role.name}
                        variant={selected ? "info" : "neutral"}
                        icon={selected ? "checkmark" : undefined}
                      />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Card>
        </FormField>

        <InlineError message={error} />
      </ScrollView>

      <View className="border-t border-border bg-card px-4 pt-3" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button
          title={isEdit ? "Save changes" : "Create account"}
          onPress={handleSubmit}
          loading={isPending}
        />
      </View>
    </View>
  );
}
