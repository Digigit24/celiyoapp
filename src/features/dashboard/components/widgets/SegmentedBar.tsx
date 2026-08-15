import React, { useState } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import { tapFeedback } from "../../../../lib/haptics";
import { useDashboardPalette, useThemeColors } from "../../palette";

export interface Segment {
  label: string;
  value: number;
  color?: string;
  onPress?: () => void;
}

interface SegmentedBarProps {
  segments: Segment[];
  /** Formats each legend row's value (defaults to plain integer). */
  format?: (n: number) => string;
  /** Center/summary text shown above the bar (e.g. total collected). */
  summary?: string;
  summaryLabel?: string;
}

/** Proportional multi-color bar + legend — a donut chart's flat, no-SVG-needed cousin. */
export function SegmentedBar({ segments, format, summary, summaryLabel }: SegmentedBarProps) {
  const palette = useDashboardPalette();
  const themeColors = useThemeColors();
  const [barWidth, setBarWidth] = useState(0);
  const total = segments.reduce((sum, s) => sum + Math.max(s.value, 0), 0);
  const withColor = segments.map((s, i) => ({ ...s, color: s.color ?? palette.series[i % palette.series.length] }));
  const fmt = format ?? ((n: number) => Math.round(n).toLocaleString("en-IN"));
  const onLayout = (e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width);

  return (
    <View className="gap-4">
      {summary ? (
        <View>
          <Text className="text-[22px] font-extrabold text-card-foreground">{summary}</Text>
          {summaryLabel ? <Text className="text-xs text-muted-foreground">{summaryLabel}</Text> : null}
        </View>
      ) : null}

      <View
        onLayout={onLayout}
        className="h-3.5 flex-row overflow-hidden rounded-full"
        style={{ backgroundColor: themeColors.muted }}
      >
        {barWidth > 0 &&
          (total <= 0
            ? null
            : withColor
                .filter((s) => s.value > 0)
                .map((s, i) => (
                  <View
                    key={`${s.label}-${i}`}
                    style={{ width: Math.max((s.value / total) * barWidth, 4), backgroundColor: s.color }}
                  />
                )))}
      </View>

      <View className="gap-3">
        {withColor.map((s, i) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          const Row = s.onPress ? Pressable : View;
          return (
            <Row
              key={`${s.label}-${i}`}
              accessibilityRole={s.onPress ? "button" : undefined}
              onPress={
                s.onPress
                  ? () => {
                      tapFeedback();
                      s.onPress?.();
                    }
                  : undefined
              }
              className={["flex-row items-center gap-2.5", s.onPress ? "active:opacity-60" : ""].join(" ")}
            >
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <Text className="flex-1 text-[13.5px] font-medium text-card-foreground" numberOfLines={1}>
                {s.label}
              </Text>
              <Text className="text-[13.5px] font-bold text-card-foreground">{fmt(s.value)}</Text>
              <Text className="w-10 text-right text-[11px] text-muted-foreground">
                {pct.toFixed(0)}%
              </Text>
            </Row>
          );
        })}
      </View>
    </View>
  );
}
