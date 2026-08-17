import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { darkColors, lightColors } from "../../theme/colors";
import { useTheme } from "../../theme/ThemeProvider";

interface SearchHeaderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Optional right action (e.g., a filter icon button). */
  right?: React.ReactNode;
}

/**
 * Top-of-screen search bar with optional leading clear and trailing action.
 * Sits above lists (Rule #1) or stacks below the screen header (Rule #10).
 */
export function SearchHeader({
  value,
  onChange,
  placeholder = "Search…",
  right,
}: SearchHeaderProps) {
  const { isDark } = useTheme();
  const colors = isDark ? darkColors : lightColors;

  return (
    <View className="flex-row items-center gap-2 px-4 py-3">
      <View
        className="flex-1 flex-row items-center gap-2 rounded-full bg-secondary px-3 h-11"
        style={{
          shadowColor: "#0f172a",
          shadowOpacity: isDark ? 0 : 0.04,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}
      >
        <Ionicons name="search" size={18} color={colors["muted-foreground"]} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors["muted-foreground"]}
          className="flex-1 text-[15px] text-foreground"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => onChange("")}
            className="h-6 w-6 items-center justify-center rounded-full active:opacity-70"
          >
            <Ionicons
              name="close-circle"
              size={16}
              color={colors["muted-foreground"]}
            />
          </Pressable>
        ) : null}
      </View>
      {right}
    </View>
  );
}

interface FilterBarProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * Horizontal scroll of filter chips. Pairs with `SearchHeader` directly below.
 * The selected chip uses the primary tint, others stay neutral.
 */
export function FilterBar({ options, value, onChange }: FilterBarProps) {
  return (
    <View className="pb-2">
      <Text
        className="sr-only"
        accessibilityRole="header"
      >
        Filters
      </Text>
      <View className="flex-row gap-2 px-4">
        {options.map((opt) => {
          const selected = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(opt.id)}
              className={[
                "h-8 items-center justify-center rounded-full px-3",
                selected ? "bg-primary" : "bg-secondary active:opacity-70",
              ].join(" ")}
            >
              <Text
                className={[
                  "text-[13px] font-medium",
                  selected ? "text-primary-foreground" : "text-secondary-foreground",
                ].join(" ")}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}