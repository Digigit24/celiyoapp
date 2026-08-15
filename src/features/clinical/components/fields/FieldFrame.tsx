import React from "react";
import { Text, View } from "react-native";
import type { ClinicalFormField } from "../../../../types/clinical";

/** Suppressed for field types that already show help_text as a placeholder/caption. */
const SUPPRESS_HELP_TEXT: Set<string> = new Set(["text", "textarea", "picklist", "boolean"]);

interface FieldFrameProps {
  field: ClinicalFormField;
  error?: string;
  children: React.ReactNode;
}

export function FieldFrame({ field, error, children }: FieldFrameProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">
        {field.label}
        {field.is_required ? <Text className="text-destructive"> *</Text> : null}
      </Text>
      {children}
      {field.help_text && !SUPPRESS_HELP_TEXT.has(field.field_type) ? (
        <Text className="text-xs text-muted-foreground">{field.help_text}</Text>
      ) : null}
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}

export interface FieldComponentProps {
  field: ClinicalFormField;
  value: unknown;
  onChange: (value: unknown, opts?: { isDefaultApply?: boolean }) => void;
  disabled?: boolean;
  error?: string;
  values: Record<string, unknown>;
}

export function resolveSourceValue(
  field: ClinicalFormField,
  encounter: Record<string, unknown> | undefined
): { hasSource: boolean; sourceValue: unknown } {
  const source = field.config?.source;
  if (typeof source !== "string" || !source.startsWith("encounter.")) {
    return { hasSource: false, sourceValue: undefined };
  }
  const path = source.slice("encounter.".length).split(".");
  let current: unknown = encounter;
  for (const part of path) {
    if (typeof current !== "object" || current === null) {
      current = undefined;
      break;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return { hasSource: true, sourceValue: current };
}
