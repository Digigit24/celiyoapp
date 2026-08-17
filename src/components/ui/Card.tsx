import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  padded?: boolean;
  /** Surface tone. `default` uses bg-card; `subtle` uses bg-surface for nested groups. */
  tone?: "default" | "subtle";
  /** Disable the rounded corners (used by tab strip pills). */
  squared?: boolean;
}

export function Card({
  padded = true,
  tone = "default",
  squared,
  className,
  ...props
}: CardProps & { className?: string }) {
  return (
    <View
      className={[
        "border border-border/60 shadow-sm shadow-black/5",
        squared ? "" : "rounded-2xl",
        tone === "subtle" ? "bg-surface" : "bg-card",
        padded ? "p-4" : "",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}