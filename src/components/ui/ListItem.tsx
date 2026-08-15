import React from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ListItemProps extends Omit<PressableProps, "children"> {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  right?: React.ReactNode;
  /** Show a trailing chevron (defaults to true when onPress is set). */
  chevron?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  right,
  chevron,
  ...props
}: ListItemProps) {
  const showChevron = chevron ?? Boolean(props.onPress);
  return (
    <Pressable
      accessibilityRole="button"
      className={[
        "flex-row items-center gap-3 bg-card px-4 py-3.5 border-b border-border",
        props.onPress ? "active:bg-accent" : "",
        props.disabled ? "opacity-50" : "",
      ].join(" ")}
      {...props}
    >
      {leftIcon ? (
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <Ionicons name={leftIcon} size={18} color="#2563eb" />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-base font-medium text-card-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color="#64748b" />
      ) : null}
    </Pressable>
  );
}
