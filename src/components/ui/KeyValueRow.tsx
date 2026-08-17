import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface KeyValueRowProps {
  label: string;
  value: React.ReactNode;
  /** Optional right-aligned affordance (copy button, chevron, etc.). */
  action?: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label?: string };
  /** Wrap the whole row in a pressable with this onPress. */
  onPress?: () => void;
}

/**
 * Dense two-column row used inside detail headers and settings-style lists.
 * Label gets an eyebrow style; value gets the prominent text.
 */
export function KeyValueRow({ label, value, action, onPress }: KeyValueRowProps) {
  return (
    <View
      className={[
        "flex-row items-center justify-between gap-3 py-2.5 px-1",
        onPress ? "active:opacity-70" : "",
      ].join(" ")}
    >
      <Text
        className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
        numberOfLines={1}
      >
        {label}
      </Text>
      <View className="flex-row items-center gap-2 max-w-[65%]">
        {typeof value === "string" || typeof value === "number" ? (
          <Text
            className="text-[15px] font-medium text-foreground text-right"
            numberOfLines={1}
          >
            {value}
          </Text>
        ) : (
          value
        )}
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={action.label ?? action.icon}
            hitSlop={8}
            onPress={action.onPress}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-muted"
          >
            <Ionicons name={action.icon} size={16} color="#475569" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}