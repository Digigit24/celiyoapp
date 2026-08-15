import React from "react";
import { Pressable, Text, View } from "react-native";
import { tapFeedback } from "../../../../lib/haptics";
import { RANGE_OPTIONS, type RangeKey } from "../../utils";

const CHIP_LABEL: Record<RangeKey, string> = { today: "Today", week: "7D", month: "30D" };

interface RangePickerProps {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}

export function RangePicker({ value, onChange }: RangePickerProps) {
  return (
    <View className="flex-row gap-1.5 rounded-full bg-muted p-1">
      {RANGE_OPTIONS.map((key) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                tapFeedback();
                onChange(key);
              }
            }}
            // `shadow-*` utility classes need native-side interop handling
            // (unlike plain colors/spacing), and toggling their presence on
            // and off between renders was forcing a remount deep in this
            // tree that occasionally corrupted navigation context. Keep the
            // shadow style present at all times and only vary its opacity
            // via a plain numeric style value instead.
            className={["rounded-full px-3 py-1.5", active ? "bg-card" : ""].join(" ")}
            style={{
              shadowColor: "#0f172a",
              shadowOpacity: active ? 0.1 : 0,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: active ? 2 : 0,
            }}
          >
            <Text
              className={[
                "text-xs font-semibold",
                active ? "text-primary" : "text-muted-foreground",
              ].join(" ")}
            >
              {CHIP_LABEL[key]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
