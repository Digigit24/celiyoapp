import React from "react";
import { Pressable, Text, View, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ListItemProps extends Omit<PressableProps, "children"> {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  /** Avatar slot rendered on the left when `leftIcon` is not set. */
  leftAvatar?: React.ReactNode;
  right?: React.ReactNode;
  /** Show a trailing chevron (defaults to true when onPress is set). */
  chevron?: boolean;
  /** Eyebrow text above the title (e.g. patient ID). */
  eyebrow?: string;
  /** Optional status chip rendered to the right of the title row. */
  chip?: React.ReactNode;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  leftAvatar,
  right,
  chevron,
  eyebrow,
  chip,
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
      {leftAvatar ? (
        leftAvatar
      ) : leftIcon ? (
        <View className="h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <Ionicons name={leftIcon} size={18} color="#2563eb" />
        </View>
      ) : null}
      <View className="flex-1 min-w-0">
        {eyebrow ? (
          <Text
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            numberOfLines={1}
          >
            {eyebrow}
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          <Text
            className="text-[15px] font-medium text-card-foreground flex-1"
            numberOfLines={1}
          >
            {title}
          </Text>
          {chip}
        </View>
        {subtitle ? (
          <Text
            className="text-sm text-muted-foreground"
            numberOfLines={1}
          >
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