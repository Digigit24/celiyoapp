import React, { useState } from "react";
import { Text, View, type LayoutChangeEvent } from "react-native";
import { useDashboardPalette, useThemeColors } from "../../palette";

export interface TrendPoint {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  points: TrendPoint[];
  color?: string;
  height?: number;
  /** Formats the latest-value badge shown top-right. */
  format?: (n: number) => string;
  /** Trims to the most recent N points so bars stay touch-friendly on a phone (default 14). */
  maxPoints?: number;
}

const BAR_GAP = 5;
const MIN_BAR_WIDTH = 6;
const MAX_BAR_WIDTH = 22;

/**
 * Lightweight column chart built from plain Views — no SVG dependency in this
 * app yet. Measures its own width via onLayout so bar widths are computed
 * exactly (no flex/gap rounding drift that can bleed bars past the right
 * edge on narrow phones).
 */
export function MiniBarChart({ points: rawPoints, color, height = 72, format, maxPoints = 14 }: MiniBarChartProps) {
  const palette = useDashboardPalette();
  const themeColors = useThemeColors();
  const fill = color ?? palette.primary;
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString("en-IN"));
  const [width, setWidth] = useState(0);

  const points = rawPoints.slice(-maxPoints);
  const max = Math.max(...points.map((p) => p.value), 1);
  const latest = points[points.length - 1];

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (points.length === 0) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-xs text-muted-foreground">No data for this range</Text>
      </View>
    );
  }

  const totalGap = BAR_GAP * Math.max(points.length - 1, 0);
  const barWidth =
    width > 0 ? Math.min(Math.max((width - totalGap) / points.length, MIN_BAR_WIDTH), MAX_BAR_WIDTH) : 0;
  const radius = Math.min(barWidth / 2, 6);

  return (
    <View className="gap-2.5">
      {latest ? (
        <View className="flex-row items-baseline justify-between">
          <Text className="text-[11px] text-muted-foreground">Latest · {latest.label}</Text>
          <Text className="text-base font-bold text-card-foreground">{fmt(latest.value)}</Text>
        </View>
      ) : null}

      <View
        onLayout={onLayout}
        className="flex-row items-end justify-center overflow-hidden"
        style={{ height, gap: BAR_GAP }}
        accessibilityRole="image"
        accessibilityLabel={`Trend over ${points.length} days`}
      >
        {width > 0
          ? points.map((p, i) => {
              const barHeight = Math.max((p.value / max) * (height - 4), 3);
              const isLast = i === points.length - 1;
              return (
                <View
                  key={`${p.label}-${i}`}
                  style={{
                    width: barWidth,
                    height: barHeight,
                    borderTopLeftRadius: radius,
                    borderTopRightRadius: radius,
                    backgroundColor: isLast ? fill : `${fill}4d`,
                  }}
                />
              );
            })
          : null}
      </View>
      <View className="h-px w-full" style={{ backgroundColor: themeColors.border }} />

      <View className="flex-row justify-between">
        <Text className="text-[10px] text-muted-foreground">{points[0]?.label}</Text>
        {points.length > 2 ? (
          <Text className="text-[10px] text-muted-foreground">
            {points[Math.floor(points.length / 2)]?.label}
          </Text>
        ) : null}
        <Text className="text-[10px] text-muted-foreground">{points[points.length - 1]?.label}</Text>
      </View>
    </View>
  );
}
