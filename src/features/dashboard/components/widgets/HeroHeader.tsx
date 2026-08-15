import React from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useDashboardPalette } from "../../palette";

interface HeroHeaderProps {
  name: string;
  tenantName?: string | null;
  role?: string | null;
  dateLabel: string;
}

/** Gradient greeting card — the dashboard's visual anchor, everything else reads as flat white cards beneath it. */
export function HeroHeader({ name, tenantName, role, dateLabel }: HeroHeaderProps) {
  const palette = useDashboardPalette();

  return (
    <LinearGradient
      colors={palette.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 28, overflow: "hidden" }}
      className="relative p-5"
    >
      {/* Decorative depth — soft translucent orbs, no image assets needed. */}
      <View
        pointerEvents="none"
        className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/10"
      />
      <View
        pointerEvents="none"
        className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-white/10"
      />

      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-1 pr-3">
          <Text style={{ color: palette.heroTextMuted }} className="text-[13px] font-medium">
            {dateLabel}
          </Text>
          <Text style={{ color: palette.heroText }} className="text-[22px] font-extrabold capitalize" numberOfLines={1}>
            Hello, {name}
          </Text>
          {tenantName ? (
            <Text style={{ color: palette.heroTextMuted }} className="text-[13px]" numberOfLines={1}>
              {tenantName}
            </Text>
          ) : null}
        </View>

        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <Ionicons name="sparkles" size={19} color="#ffffff" />
        </View>
      </View>

      {role ? (
        <View className="mt-4 flex-row">
          <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            <Ionicons name="shield-checkmark-outline" size={13} color="#ffffff" />
            <Text style={{ color: palette.heroText }} className="text-[11px] font-semibold capitalize">
              {role.replace(/_/g, " ")}
            </Text>
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
}
