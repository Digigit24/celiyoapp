import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, Skeleton } from "../../../../components/ui";
import { tapFeedback } from "../../../../lib/haptics";
import { SectionHeader } from "./SectionHeader";

interface WidgetCardProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
}

/** Standard chrome for a dashboard widget: header + independent loading/error/empty state, so one failed widget never blanks the rest of the screen. */
export function WidgetCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  loading,
  error,
  onRetry,
  empty,
  emptyMessage = "Nothing here yet",
  children,
  className,
}: WidgetCardProps) {
  return (
    <Card
      // Stays on bg-card (not surface-elevated) — ListItem rows bled to the
      // card edges below are hardcoded to bg-card, and in dark mode
      // card/surface-elevated are different tones, which would show as a
      // seam at the bottom of the card if this didn't match.
      className={["rounded-3xl border-0 shadow-none", className ?? ""].join(" ")}
      style={{
        shadowColor: "#0f172a",
        shadowOpacity: 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <SectionHeader title={title} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction} />
      {loading ? (
        <View className="gap-2">
          <Skeleton className="h-4 w-2/3 rounded" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </View>
      ) : error ? (
        <View className="items-center gap-2 py-4">
          <Ionicons name="alert-circle-outline" size={22} color="#ef4444" />
          <Text className="text-xs text-muted-foreground">Couldn't load this</Text>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                tapFeedback();
                onRetry();
              }}
              className="rounded-full bg-secondary px-3 py-1.5 active:opacity-70"
            >
              <Text className="text-xs font-semibold text-secondary-foreground">Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : empty ? (
        <View className="items-center py-4">
          <Text className="text-xs text-muted-foreground">{emptyMessage}</Text>
        </View>
      ) : (
        children
      )}
    </Card>
  );
}
