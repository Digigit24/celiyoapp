import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "./EmptyState";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string) => void;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
}

/** Dropdown backed by a modal list — the RN stand-in for a web select. */
export function Select({
  label,
  placeholder = "Select…",
  options,
  value,
  onChange,
  error,
  loading = false,
  disabled = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="w-full gap-1.5">
      {label ? (
        <Text className="text-sm font-medium text-foreground">{label}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled || loading}
        onPress={() => setOpen(true)}
        className={[
          "flex-row items-center justify-between rounded-lg border bg-card px-3 h-11",
          error ? "border-destructive" : "border-input",
          disabled || loading ? "opacity-50" : "active:opacity-80",
        ].join(" ")}
      >
        <Text
          className={[
            "text-base",
            selected ? "text-foreground" : "text-muted-foreground",
          ].join(" ")}
          numberOfLines={1}
        >
          {loading ? "Loading…" : selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </Pressable>
      {error ? (
        <Text className="text-xs text-destructive">{error}</Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-popover rounded-t-2xl max-h-[70%] pb-6"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
              <Text className="text-base font-semibold text-popover-foreground">
                {label ?? placeholder}
              </Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>
            {options.length === 0 ? (
              <EmptyState
                icon="list-outline"
                title="No options"
                message="Nothing to choose from yet."
              />
            ) : (
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className="flex-row items-center justify-between px-4 py-3.5 border-b border-border active:bg-accent"
                  >
                    <Text className="text-base text-popover-foreground flex-1">
                      {item.label}
                    </Text>
                    {item.value === value ? (
                      <Ionicons name="checkmark" size={18} color="#2563eb" />
                    ) : null}
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
