import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

export interface TabStripItem<K extends string> {
  key: K;
  label: string;
}

interface TabStripProps<K extends string> {
  tabs: TabStripItem<K>[];
  activeKey: K;
  onChange: (key: K) => void;
  scrollable?: boolean;
}

/** Horizontal pill-tab row — the segmented-control pattern used across list/detail screens. */
export function TabStrip<K extends string>({ tabs, activeKey, onChange, scrollable }: TabStripProps<K>) {
  const pills = tabs.map((t) => {
    const active = t.key === activeKey;
    return (
      <Pressable
        key={t.key}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onChange(t.key)}
        hitSlop={4}
        className={["min-h-[44px] justify-center px-4 py-2.5 rounded-full", active ? "bg-primary" : "bg-secondary"].join(" ")}
      >
        <Text className={["text-base font-semibold", active ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
          {t.label}
        </Text>
      </Pressable>
    );
  });

  if (scrollable) {
    // Fixed-height wrapper + flexGrow:0 on the ScrollView itself: a bare
    // horizontal ScrollView placed directly inside a flex-1 column (no
    // sized parent View) can otherwise measure itself against the parent's
    // remaining space instead of its content, blowing up to fill it.
    return (
      <View style={{ height: 44 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View className="flex-row gap-2 px-4">{pills}</View>
        </ScrollView>
      </View>
    );
  }
  return <View className="flex-row flex-wrap gap-2 px-4">{pills}</View>;
}
