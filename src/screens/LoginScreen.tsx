import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { Button, InlineError, Input } from "../components/ui";
import { useAuth } from "../store/AuthContext";
import { AuthError } from "../lib/auth/authApi";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setSubmitError(
        err instanceof AuthError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10 gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Ionicons name="medkit" size={30} color="#ffffff" />
          </View>
          <Text className="text-2xl font-bold text-foreground">DigiHMS</Text>
          <Text className="text-sm text-muted-foreground text-center">
            Staff sign in — use your hospital account
          </Text>
        </View>

        <View className="gap-4">
          {submitError ? <InlineError message={submitError} /> : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email"
                placeholder="you@hospital.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                leftIcon="mail-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                leftIcon="lock-closed-outline"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                onSubmitEditing={onSubmit}
              />
            )}
          />

          <Button
            title="Sign in"
            onPress={onSubmit}
            loading={isSubmitting}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
