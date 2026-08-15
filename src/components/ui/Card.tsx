import React from "react";
import { View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  padded?: boolean;
}

export function Card({ padded = true, className, ...props }: CardProps & { className?: string }) {
  return (
    <View
      className={[
        "bg-card border border-border/60 rounded-2xl shadow-sm shadow-black/5",
        padded ? "p-4" : "",
        className ?? "",
      ].join(" ")}
      {...props}
    />
  );
}
