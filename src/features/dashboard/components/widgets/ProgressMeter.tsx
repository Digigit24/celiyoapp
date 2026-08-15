import React, { useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import { useDashboardPalette, useThemeColors } from "../../palette";

interface ProgressMeterProps {
  label: string;
  /** Display value — a plain count or an "82/100" style string. */
  value: number | string;
  /** 0-100. */
  percent: number;
  color?: string;
  /** Small text under the bar, e.g. "avg stay 4.2 days". */
  footnote?: string;
}

/**
 * Horizontal rounded meter — occupancy %, patient-flow completion, etc.
 * Fill width is computed from a measured pixel width (onLayout), not a CSS
 * percentage string, so it renders correctly regardless of ancestor flex
 * quirks. Track uses a solid muted color for real contrast against the fill.
 */
export function ProgressMeter({ label, value, percent, color, footnote }: ProgressMeterProps) {
  const palette = useDashboardPalette();
  const themeColors = useThemeColors();
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = Math.max(0, Math.min(100, percent));
  const fill =
    color ?? (clamped >= 95 ? palette.danger : clamped >= 85 ? palette.warning : palette.primary);

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);
  const fillWidth = trackWidth > 0 ? Math.max((clamped / 100) * trackWidth, clamped > 0 ? 6 : 0) : 0;

  return (
    <View className="gap-2">
      <View className="flex-row items-end justify-between">
        <Text className="text-[13px] font-medium text-muted-foreground">{label}</Text>
        <Text className="text-[15px] font-bold text-card-foreground">{value}</Text>
      </View>
      <View
        onLayout={onLayout}
        className="h-2.5 overflow-hidden rounded-full"
        style={{ backgroundColor: themeColors.muted }}
      >
        {trackWidth > 0 ? (
          <View className="h-full rounded-full" style={{ width: fillWidth, backgroundColor: fill }} />
        ) : null}
      </View>
      {footnote ? <Text className="text-[11px] text-muted-foreground">{footnote}</Text> : null}
    </View>
  );
}
