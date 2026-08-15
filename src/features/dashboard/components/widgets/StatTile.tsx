import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton } from "../../../../components/ui";
import { tapFeedback } from "../../../../lib/haptics";
import { useDashboardPalette } from "../../palette";
import { useCountUp } from "./useCountUp";

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: number;
  format?: (n: number) => string;
  /** Percentage change vs. the prior period, already computed. */
  delta?: number | null;
  /** Whether a rising value reads as good (default) or bad (e.g. pending dues). */
  deltaGood?: "up" | "down";
  loading?: boolean;
  onPress?: () => void;
  className?: string;
}

/**
 * Compact KPI tile. No hairline border — depth comes from a soft elevated
 * surface tone (bg-surface-elevated, distinct from the page background) plus
 * a diffused shadow, so it reads as a floating card rather than an outlined box.
 */
export function StatTile({
  icon,
  tint,
  label,
  value,
  format,
  delta,
  deltaGood = "up",
  loading,
  onPress,
  className,
}: StatTileProps) {
  const palette = useDashboardPalette();
  const animated = useCountUp(loading ? 0 : value);
  const text = format ? format(animated) : Math.round(animated).toLocaleString("en-IN");

  const deltaPositive = delta != null && delta > 0;
  const deltaNegative = delta != null && delta < 0;
  const deltaIsGood =
    delta != null && delta !== 0 ? (deltaGood === "up" ? deltaPositive : deltaNegative) : null;

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      accessibilityRole={onPress ? "button" : undefined}
      onPress={
        onPress
          ? () => {
              tapFeedback();
              onPress();
            }
          : undefined
      }
      className={[
        "gap-2.5 rounded-2xl bg-surface-elevated p-3",
        onPress ? "active:opacity-70" : "",
        className ?? "flex-1",
      ].join(" ")}
      style={{
        shadowColor: "#0f172a",
        shadowOpacity: 0.12,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 5 },
        elevation: 3,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="h-8 w-8 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${tint}1f` }}
        >
          <Ionicons name={icon} size={15} color={tint} />
        </View>
        {delta != null && !loading ? (
          <View
            className="flex-row items-center gap-0.5 rounded-full px-1.5 py-[1px]"
            style={{
              backgroundColor:
                deltaIsGood === null
                  ? `${palette.neutral}1a`
                  : deltaIsGood
                    ? `${palette.success}1a`
                    : `${palette.danger}1a`,
            }}
          >
            <Ionicons
              name={deltaPositive ? "arrow-up" : deltaNegative ? "arrow-down" : "remove"}
              size={9}
              color={deltaIsGood === null ? palette.neutral : deltaIsGood ? palette.success : palette.danger}
            />
            <Text
              className="text-[9.5px] font-bold"
              style={{ color: deltaIsGood === null ? palette.neutral : deltaIsGood ? palette.success : palette.danger }}
            >
              {Math.abs(delta).toFixed(0)}%
            </Text>
          </View>
        ) : null}
      </View>
      <View className="gap-0.5">
        {loading ? (
          <Skeleton className="h-6 w-14 rounded-md" />
        ) : (
          <Text className="text-[19px] font-extrabold leading-6 text-card-foreground" numberOfLines={1}>
            {text}
          </Text>
        )}
        <Text className="text-[11px] font-medium text-muted-foreground" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Wrapper>
  );
}
