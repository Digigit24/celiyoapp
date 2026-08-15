import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { SaveStatus } from "../lib/useAutosave";

const STYLES: Record<SaveStatus, { dot: string; label: string }> = {
  idle: { dot: "bg-muted-foreground", label: "" },
  dirty: { dot: "bg-amber-500", label: "Unsaved changes" },
  saving: { dot: "bg-primary", label: "Saving…" },
  saved: { dot: "bg-emerald-500", label: "Autosaved" },
  error: { dot: "bg-destructive", label: "Retrying…" },
  offline: { dot: "bg-amber-500", label: "Saved on this device" },
};

export function EmrSaveIndicator({ status }: { status: SaveStatus }) {
  const style = STYLES[status];
  if (!style.label) return null;
  return (
    <View className="flex-row items-center gap-1.5">
      {status === "saving" ? (
        <ActivityIndicator size="small" />
      ) : (
        <View className={["h-1.5 w-1.5 rounded-full", style.dot].join(" ")} />
      )}
      <Text className="text-xs text-muted-foreground">{style.label}</Text>
    </View>
  );
}
