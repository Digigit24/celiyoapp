import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center gap-2 px-8 py-12">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-muted mb-1">
        <Ionicons name={icon} size={26} color="#64748b" />
      </View>
      <Text className="text-base font-semibold text-foreground text-center">
        {title}
      </Text>
      {message ? (
        <Text className="text-sm text-muted-foreground text-center">
          {message}
        </Text>
      ) : null}
      {action ? <View className="mt-3">{action}</View> : null}
    </View>
  );
}
