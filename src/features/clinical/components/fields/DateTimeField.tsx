import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { FieldFrame, resolveSourceValue, type FieldComponentProps } from "./FieldFrame";

interface Props extends FieldComponentProps {
  encounter?: Record<string, unknown>;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toStored(date: Date, fieldType: string): string {
  if (fieldType === "date") {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  if (fieldType === "time") {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  return date.toISOString();
}

function fromStored(raw: unknown, fieldType: string): Date {
  if (typeof raw === "string" && raw) {
    if (fieldType === "time") {
      const [h, m] = raw.split(":").map(Number);
      const d = new Date();
      d.setHours(h || 0, m || 0, 0, 0);
      return d;
    }
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function display(raw: unknown, fieldType: string): string {
  if (!raw) return "";
  const date = fromStored(raw, fieldType);
  if (fieldType === "date") return date.toLocaleDateString();
  if (fieldType === "time") return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleString();
}

export function DateTimeField({ field, value, onChange, disabled, error, encounter }: Props) {
  const { hasSource, sourceValue } = resolveSourceValue(field, encounter);
  const effectiveValue = hasSource ? sourceValue : value;
  const [open, setOpen] = useState(false);
  const appliedDefault = useRef(false);

  useEffect(() => {
    if (appliedDefault.current || hasSource) return;
    appliedDefault.current = true;
    if ((value === undefined || value === "" || value === null) && field.config?.default_now) {
      onChange(toStored(new Date(), field.field_type), { isDefaultApply: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed" || !date) return;
    onChange(toStored(date, field.field_type));
  }

  const mode = field.field_type === "date" ? "date" : field.field_type === "time" ? "time" : "datetime";

  return (
    <FieldFrame field={field} error={error}>
      <View className="flex-row gap-2">
        <Pressable
          disabled={disabled || hasSource}
          accessibilityRole="button"
          onPress={() => setOpen(true)}
          className={[
            "flex-1 h-11 flex-row items-center justify-between rounded-lg border bg-card px-3",
            error ? "border-destructive" : "border-input",
            disabled || hasSource ? "opacity-50" : "",
          ].join(" ")}
        >
          <Text className={effectiveValue ? "text-base text-foreground" : "text-base text-muted-foreground"}>
            {display(effectiveValue, field.field_type) || "Select…"}
          </Text>
          <Ionicons name="calendar-outline" size={16} color="#64748b" />
        </Pressable>
        {!disabled && !hasSource ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange(toStored(new Date(), field.field_type))}
            className="h-11 px-3 items-center justify-center rounded-lg border border-input bg-secondary"
          >
            <Text className="text-sm font-medium text-secondary-foreground">Now</Text>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <DateTimePicker
          value={fromStored(effectiveValue, field.field_type)}
          mode={mode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      ) : null}
    </FieldFrame>
  );
}
