import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TimelineRowProps {
  /** Heading text — short (e.g., "Admitted", "Vitals taken"). */
  title: string;
  /** Optional supporting line. */
  subtitle?: string;
  /** Relative time string ("2h ago", "Yesterday"). */
  when?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Tints the dot and the icon puck. Defaults to blue. */
  tint?: "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";
  /** Hide the connector to the next row (use on the last row). */
  isLast?: boolean;
}

const tintDot: Record<NonNullable<TimelineRowProps["tint"]>, string> = {
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  slate: "bg-slate-400",
};

/**
 * Single row in a vertical timeline (IPD admissions, audit trail, etc.).
 * Renders a coloured dot connected to the next row via a vertical line.
 */
export function TimelineRow({
  title,
  subtitle,
  when,
  icon = "ellipse",
  tint = "blue",
  isLast,
}: TimelineRowProps) {
  return (
    <View className="flex-row gap-3 pb-4">
      <View className="items-center">
        <View
          className={[
            "h-7 w-7 items-center justify-center rounded-full border-2 border-card",
            tintDot[tint],
          ].join(" ")}
        >
          <Ionicons name={icon as never} size={12} color="#ffffff" />
        </View>
        {isLast ? null : (
          <View className="w-0.5 flex-1 bg-border mt-1" />
        )}
      </View>
      <View className="flex-1 pt-0.5">
        <View className="flex-row items-center justify-between">
          <Text
            className="text-[15px] font-semibold text-foreground"
            numberOfLines={1}
          >
            {title}
          </Text>
          {when ? (
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {when}
            </Text>
          ) : null}
        </View>
        {subtitle ? (
          <Text
            className="mt-0.5 text-sm text-muted-foreground"
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}