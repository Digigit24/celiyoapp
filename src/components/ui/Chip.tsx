import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tapFeedback } from "../../lib/haptics";

export type ChipVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  /** Optional leading icon. Sized 14, matches label height. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional trailing close icon — turns the chip into a removable filter. */
  onRemove?: () => void;
}

/**
 * Compact status / category / filter indicator. Pair this with `bg-{family}-50`
 * and `text-{family}-700` per the design tokens. The variants here cover the
 * semantic shortcuts so screen code doesn't repeat the colour pairing.
 *
 * Rule from UI-CONSISTENCY-RULES #4: Badge is reserved for tenant / role
 * identity. For status, category, and filters, use Chip.
 */
export function Chip({ label, variant = "neutral", icon, onRemove }: ChipProps) {
  const styles = variantStyles[variant];

  return (
    <View
      accessibilityRole={onRemove ? "button" : "text"}
      className={[
        "flex-row items-center gap-1 rounded-full px-2.5 py-1 self-start",
        styles.container,
      ].join(" ")}
    >
      {icon ? <Ionicons name={icon} size={13} color={styles.icon} /> : null}
      <Text className={["text-[11px] font-semibold", styles.label].join(" ")}>
        {label}
      </Text>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          hitSlop={8}
          onPress={() => {
            tapFeedback();
            onRemove();
          }}
          className="ml-0.5 -mr-1 h-4 w-4 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="close" size={12} color={styles.icon} />
        </Pressable>
      ) : null}
    </View>
  );
}

const variantStyles: Record<
  ChipVariant,
  { container: string; label: string; icon: string }
> = {
  success: {
    container: "bg-emerald-50",
    label: "text-emerald-700",
    icon: "#047857",
  },
  warning: {
    container: "bg-amber-50",
    label: "text-amber-800",
    icon: "#92400e",
  },
  danger: {
    container: "bg-rose-50",
    label: "text-rose-600",
    icon: "#9f1239",
  },
  info: {
    container: "bg-blue-50",
    label: "text-blue-700",
    icon: "#1e40af",
  },
  neutral: {
    container: "bg-muted",
    label: "text-muted-foreground",
    icon: "#475569",
  },
};