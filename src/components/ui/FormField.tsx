import React from "react";
import { Text, View } from "react-native";

interface FormFieldProps {
  /** Field label rendered above the input. */
  label: string;
  /** Mark the field as required (renders a small asterisk). */
  required?: boolean;
  /** Helper text shown below the input. Replaced by error text when invalid. */
  helper?: string;
  /** Error message. When set, the helper is hidden and the field flips red. */
  error?: string;
  children: React.ReactNode;
}

/**
 * Composable form field with label + helper/error. Children render the actual
 * input control. See UI-CONSISTENCY-RULES #3 for the contract this enforces.
 */
export function FormField({ label, required, helper, error, children }: FormFieldProps) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
          {label}
        </Text>
        {required ? (
          <Text className="text-sm font-semibold text-destructive" accessibilityLabel="required">
            *
          </Text>
        ) : null}
      </View>
      {children}
      {error ? (
        <Text className="text-xs text-destructive" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : helper ? (
        <Text className="text-xs text-muted-foreground">{helper}</Text>
      ) : null}
    </View>
  );
}