import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

/**
 * Empty / loading-failed state. Use as `ListEmptyComponent` on FlatLists (Rule
 * #5) or as a standalone centred block. Sizes:
 * - `sm`: 96px tall, 14px icon — for inline list cells
 * - `md`: 160px tall, 26px icon — the default for list screens
 * - `lg`: 240px tall, 38px icon — for hero empty states (first launch)
 */
export function EmptyState({
  icon = "file-tray-outline",
  title,
  message,
  action,
  size = "md",
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#94a3b8" : "#64748b";

  const dimensions = {
    sm: { padding: "py-6 px-4", iconBg: "h-10 w-10", iconSize: 18, titleClass: "text-sm" },
    md: { padding: "py-12 px-8", iconBg: "h-14 w-14", iconSize: 26, titleClass: "text-base" },
    lg: { padding: "py-16 px-8", iconBg: "h-20 w-20", iconSize: 38, titleClass: "text-lg" },
  }[size];

  return (
    <View className={`items-center justify-center gap-3 ${dimensions.padding}`}>
      <View
        className={[
          dimensions.iconBg,
          "items-center justify-center rounded-full bg-muted",
        ].join(" ")}
      >
        <Ionicons name={icon} size={dimensions.iconSize} color={iconColor} />
      </View>
      <Text
        className={`${dimensions.titleClass} font-semibold text-foreground text-center`}
        numberOfLines={2}
      >
        {title}
      </Text>
      {message ? (
        <Text
          className="text-sm text-muted-foreground text-center"
          numberOfLines={3}
        >
          {message}
        </Text>
      ) : null}
      {action ? <View className="mt-1">{action}</View> : null}
    </View>
  );
}