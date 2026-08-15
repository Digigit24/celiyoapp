import React, { useEffect, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FieldFrame, resolveSourceValue, type FieldComponentProps } from "./FieldFrame";
import { safeCompute } from "../../lib/compute";

interface Props extends FieldComponentProps {
  encounter?: Record<string, unknown>;
}

export function TextField({ field, value, onChange, disabled, error, encounter }: Props) {
  const { hasSource, sourceValue } = resolveSourceValue(field, encounter);
  const displayValue = hasSource ? String(sourceValue ?? "") : String(value ?? "");
  const isTextarea = field.field_type === "textarea" || field.field_type === "rich_text";
  return (
    <FieldFrame field={field} error={error}>
      <View
        className={[
          "rounded-lg border bg-card px-3",
          isTextarea ? "min-h-[88px] py-2.5" : "h-11 justify-center",
          error ? "border-destructive" : "border-input",
        ].join(" ")}
      >
        <TextInput
          value={displayValue}
          onChangeText={(t) => onChange(t)}
          editable={!disabled && !hasSource}
          multiline={isTextarea}
          textAlignVertical={isTextarea ? "top" : "center"}
          placeholder={field.help_text || undefined}
          placeholderTextColor="#94a3b8"
          className="text-base text-foreground"
        />
      </View>
    </FieldFrame>
  );
}

export function NumberField({ field, value, onChange, disabled, error }: Props) {
  const appliedDefault = useRef(false);
  useEffect(() => {
    if (appliedDefault.current) return;
    appliedDefault.current = true;
    const def = field.config?.default_value ?? field.default_value;
    if ((value === undefined || value === "" || value === null) && def !== undefined && def !== null) {
      onChange(def, { isDefaultApply: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FieldFrame field={field} error={error}>
      <View
        className={[
          "h-11 justify-center rounded-lg border bg-card px-3",
          error ? "border-destructive" : "border-input",
        ].join(" ")}
      >
        <TextInput
          value={value === undefined || value === null ? "" : String(value)}
          onChangeText={(t) => onChange(t === "" ? "" : Number(t.replace(/[^0-9.-]/g, "")))}
          editable={!disabled}
          keyboardType="numeric"
          placeholder={field.help_text || undefined}
          placeholderTextColor="#94a3b8"
          className="text-base text-foreground"
        />
      </View>
    </FieldFrame>
  );
}

export function YesNoField({ field, value, onChange, disabled, error }: Props) {
  const options: Array<{ label: string; value: "yes" | "no" | "na" }> = [
    { label: "Yes", value: "yes" },
    { label: "No", value: "no" },
    { label: "N/A", value: "na" },
  ];
  return (
    <FieldFrame field={field} error={error}>
      <View className="flex-row gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              disabled={disabled}
              accessibilityRole="button"
              onPress={() => onChange(selected ? "" : opt.value)}
              className={[
                "flex-1 h-10 items-center justify-center rounded-lg border",
                selected ? "bg-primary border-primary" : "bg-card border-input",
                disabled ? "opacity-50" : "",
              ].join(" ")}
            >
              <Text
                className={["text-sm font-medium", selected ? "text-primary-foreground" : "text-foreground"].join(" ")}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldFrame>
  );
}

export function BooleanField({ field, value, onChange, disabled }: Props) {
  const checked = Boolean(value);
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      className={["flex-row items-center gap-2.5 py-1", disabled ? "opacity-50" : ""].join(" ")}
    >
      <View
        className={[
          "h-5 w-5 items-center justify-center rounded border",
          checked ? "bg-primary border-primary" : "bg-card border-input",
        ].join(" ")}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
      </View>
      <Text className="flex-1 text-sm text-foreground">
        {field.label}
        {field.is_required ? <Text className="text-destructive"> *</Text> : null}
      </Text>
    </Pressable>
  );
}

export function CalculatedField({ field, values, error }: Props) {
  const computed = safeCompute(field, values);
  return (
    <FieldFrame field={field} error={error}>
      <View className="h-11 justify-center rounded-lg border border-input bg-muted px-3">
        <Text className="text-base text-foreground">{computed || "—"}</Text>
      </View>
    </FieldFrame>
  );
}

export function HeadingField({ field }: Props) {
  return (
    <View className="pt-1">
      <Text className="text-base font-semibold text-foreground">{field.label}</Text>
      {field.help_text ? (
        <Text className="text-xs text-muted-foreground mt-0.5">{field.help_text}</Text>
      ) : null}
    </View>
  );
}

export function DataRefField({ field, value, encounter }: Props) {
  const { hasSource, sourceValue } = resolveSourceValue(field, encounter);
  const display = hasSource ? sourceValue : value;
  return (
    <FieldFrame field={field}>
      <View className="h-11 justify-center rounded-lg border border-input bg-muted px-3">
        <Text className="text-base text-foreground">{display ? String(display) : "—"}</Text>
      </View>
    </FieldFrame>
  );
}

export function SignatureField({ field }: Props) {
  return (
    <FieldFrame field={field}>
      <View className="h-11 justify-center rounded-lg border border-dashed border-input bg-muted px-3">
        <Text className="text-sm text-muted-foreground">Captured on the printed form</Text>
      </View>
    </FieldFrame>
  );
}

const PAIN_SCORES = [0, 2, 4, 6, 8, 10];

export function PainFacesField({ field, value, onChange, disabled, error }: Props) {
  return (
    <FieldFrame field={field} error={error}>
      <View className="flex-row justify-between">
        {PAIN_SCORES.map((score) => {
          const selected = Number(value) === score;
          return (
            <Pressable
              key={score}
              disabled={disabled}
              accessibilityRole="button"
              onPress={() => onChange(selected ? "" : score)}
              className={[
                "h-11 w-11 items-center justify-center rounded-full border",
                selected ? "bg-primary border-primary" : "bg-card border-input",
              ].join(" ")}
            >
              <Text className={["text-sm font-semibold", selected ? "text-primary-foreground" : "text-foreground"].join(" ")}>
                {score}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </FieldFrame>
  );
}

/** body_diagram is deferred past Phase 3 per CLAUDE.md — round-trips whatever is stored without editing it. */
export function BodyDiagramField({ field, value }: Props) {
  const hasValue = Array.isArray(value) && value.length > 0;
  return (
    <FieldFrame field={field}>
      <View className="h-16 justify-center rounded-lg border border-dashed border-input bg-muted px-3">
        <Text className="text-sm text-muted-foreground">
          {hasValue
            ? `${(value as unknown[]).length} pin(s) recorded — not editable on mobile yet`
            : "Not supported on mobile yet"}
        </Text>
      </View>
    </FieldFrame>
  );
}
