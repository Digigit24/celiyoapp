import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";

type Variant = "primary" | "secondary" | "outline" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const containerVariants: Record<Variant, string> = {
  primary: "bg-primary border border-primary",
  secondary: "bg-secondary border border-secondary",
  outline: "bg-transparent border border-input",
  destructive: "bg-destructive border border-destructive",
  ghost: "bg-transparent border border-transparent",
};

const textVariants: Record<Variant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  destructive: "text-destructive-foreground",
  ghost: "text-foreground",
};

const spinnerColors: Record<Variant, string> = {
  primary: "#ffffff",
  secondary: "#0f172a",
  outline: "#0f172a",
  destructive: "#ffffff",
  ghost: "#2563eb",
};

const containerSizes: Record<Size, string> = {
  sm: "h-9 px-3 rounded-md",
  md: "h-11 px-4 rounded-lg",
  lg: "h-12 px-6 rounded-lg",
};

const textSizes: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon,
  fullWidth = true,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      className={[
        "flex-row items-center justify-center gap-2",
        containerVariants[variant],
        containerSizes[size],
        fullWidth ? "w-full" : "self-start",
        isDisabled ? "opacity-50" : "active:opacity-80",
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColors[variant]} />
      ) : (
        icon
      )}
      <Text
        className={["font-semibold", textVariants[variant], textSizes[size]].join(
          " "
        )}
      >
        {title}
      </Text>
    </Pressable>
  );
}
