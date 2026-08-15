import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ClinicalFormSection } from "../../../types/clinical";

interface SectionCardProps {
  section: ClinicalFormSection;
  children: React.ReactNode;
}

export function SectionCard({ section, children }: SectionCardProps) {
  const [collapsed, setCollapsed] = useState(Boolean(section.is_collapsed));
  const title = section.title_override || section.title;

  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <Pressable
        accessibilityRole="button"
        onPress={() => setCollapsed((c) => !c)}
        className="flex-row items-center justify-between px-4 py-3 active:bg-accent"
      >
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">{title}</Text>
          {section.description ? (
            <Text className="text-xs text-muted-foreground mt-0.5">{section.description}</Text>
          ) : null}
        </View>
        <Ionicons name={collapsed ? "chevron-down" : "chevron-up"} size={18} color="#64748b" />
      </Pressable>
      {!collapsed ? <View className="gap-3 px-4 pb-4 pt-1">{children}</View> : null}
    </View>
  );
}
