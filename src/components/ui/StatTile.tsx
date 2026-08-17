import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Tint = "blue" | "emerald" | "amber" | "rose" | "slate" | "violet";

const tintStyles: Record<Tint, { bg: string; icon: string }> = {
  blue: { bg: "bg-blue-50", icon: "#2563eb" },
  emerald: { bg: "bg-emerald-50", icon: "#059669" },
  amber: { bg: "bg-amber-50", icon: "#f59e0b" },
  rose: { bg: "bg-rose-50", icon: "#e11d48" },
  slate: { bg: "bg-slate-100", icon: "#475569" },
  violet: { bg: "bg-violet-50", icon: "#7c3aed" },
};

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string | number;
  tint?: Tint;
  hint?: string;
  /** Optional delta string (e.g., "+12% vs last week"). */
  delta?: string;
  onPress?: () => void;
}

/**
 * Single KPI tile with an icon puck, big value, label, optional delta and hint.
 * Use in 2-up or 3-up rows inside a `Card` or directly on a screen.
 */
export function StatTile({
  icon,
  label,
  value = "—",
  tint = "blue",
  hint,
  delta,
  onPress,
}: StatTileProps) {
  const t = tintStyles[tint];

  return (
    <View>
      <View
        className={[
          "flex-1 gap-3 rounded-2xl border border-border bg-card p-4",
          onPress ? "active:opacity-90" : "",
        ].join(" ")}
      >
        <View className="flex-row items-start justify-between">
          <View
            className={[
              "h-9 w-9 items-center justify-center rounded-xl",
              t.bg,
            ].join(" ")}
          >
            <Ionicons name={icon} size={18} color={t.icon} />
          </View>
          {delta ? (
            <View className="rounded-full bg-emerald-50 px-2 py-0.5">
              <Text className="text-[10px] font-semibold text-emerald-700">
                {delta}
              </Text>
            </View>
          ) : null}
        </View>
        <View className="gap-0.5">
          <Text className="text-2xl font-bold text-card-foreground" numberOfLines={1}>
            {value}
          </Text>
          <Text className="text-xs font-medium text-muted-foreground" numberOfLines={1}>
            {label}
          </Text>
        </View>
        {hint ? (
          <Text className="text-[10px] leading-3 text-muted-foreground" numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
}