import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SectionHeaderProps {
  title: string;
  count?: number | string;
  right?: { label: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void };
}

/**
 * Eyebrow header that divides a screen into groups. Pairs with the
 * `text-[11px] font-bold uppercase tracking-wider` typography role.
 *
 * Optional count after the title and a small right-aligned action button.
 */
export function SectionHeader({ title, count, right }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
      <View className="flex-row items-baseline gap-2">
        <Text
          className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          accessibilityRole="header"
        >
          {title}
        </Text>
        {count !== undefined ? (
          <Text className="text-[11px] font-semibold text-muted-foreground/70">
            {count}
          </Text>
        ) : null}
      </View>
      {right ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={right.label}
          onPress={right.onPress}
          hitSlop={8}
          className="flex-row items-center gap-1 active:opacity-70"
        >
          <Text className="text-[13px] font-semibold text-primary">{right.label}</Text>
          {right.icon ? <Ionicons name={right.icon} size={14} color="#2563eb" /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}