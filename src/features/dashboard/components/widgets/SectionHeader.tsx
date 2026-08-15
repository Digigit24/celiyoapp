import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tapFeedback } from "../../../../lib/haptics";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <View className="flex-1 gap-0.5">
        <Text className="text-[15px] font-bold text-card-foreground">{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            tapFeedback();
            onAction();
          }}
          className="flex-row items-center gap-0.5 py-1 active:opacity-60"
        >
          <Text className="text-xs font-semibold text-primary">{actionLabel ?? "See all"}</Text>
          <Ionicons name="chevron-forward" size={14} color="#2563eb" />
        </Pressable>
      ) : null}
    </View>
  );
}
