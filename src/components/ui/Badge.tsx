import React from "react";
import { Text, View } from "react-native";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "outline";

const containerVariants: Record<BadgeVariant, string> = {
  default: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-destructive",
  outline: "bg-transparent border border-border",
};

const textVariants: Record<BadgeVariant, string> = {
  default: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  success: "text-white",
  warning: "text-white",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <View
      className={[
        "self-start rounded-full px-2.5 py-0.5",
        containerVariants[variant],
      ].join(" ")}
    >
      <Text className={["text-xs font-medium", textVariants[variant]].join(" ")}>
        {label}
      </Text>
    </View>
  );
}
