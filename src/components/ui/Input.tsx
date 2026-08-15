import React, { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export function Input({
  label,
  error,
  leftIcon,
  secureTextEntry,
  ...props
}: InputProps) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View className="w-full gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}
      <View
        className={[
          "flex-row items-center gap-2 rounded-lg border bg-card px-3 h-11",
          error ? "border-destructive" : "border-input",
        ].join(" ")}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color="#64748b" />
        ) : null}
        <TextInput
          placeholderTextColor="#64748b"
          secureTextEntry={secureTextEntry ? hidden : false}
          className="flex-1 text-base text-foreground h-full"
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={18}
              color="#64748b"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : null}
    </View>
  );
}
