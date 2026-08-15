/**
 * Grid fields render as stacked cards on mobile (one card per row) rather
 * than the web's HTML table — the layout the web version already uses for
 * wide monitoring charts, generalized here to every grid. PrescriptionGrid
 * and InvestigationGrid are section-role specializations of the same field
 * type; the backend reconciles their rows into real Prescription/
 * DiagnosticOrder records on save (see the plan's "Key findings").
 */
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FieldFrame, type FieldComponentProps } from "./FieldFrame";
import { searchInvestigations, type InvestigationOption } from "../../../../lib/api/diagnostics";
import type { GridColumn } from "../../../../types/clinical";

type Row = Record<string, unknown>;

function randomRowId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function TextCell({
  label,
  value,
  onChange,
  keyboardType,
  disabled,
}: {
  label: string;
  value: unknown;
  onChange: (v: string) => void;
  keyboardType?: "default" | "numeric";
  disabled?: boolean;
}) {
  return (
    <View className="flex-1 gap-1">
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      <TextInput
        value={value === undefined || value === null ? "" : String(value)}
        onChangeText={onChange}
        editable={!disabled}
        keyboardType={keyboardType}
        className="h-10 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
      />
    </View>
  );
}

function RowCard({
  children,
  onRemove,
  removable,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  removable: boolean;
}) {
  return (
    <View className="gap-2 rounded-lg border border-border bg-card p-3">
      <View className="flex-row flex-wrap gap-2">{children}</View>
      {removable ? (
        <Pressable accessibilityRole="button" onPress={onRemove} className="self-end flex-row items-center gap-1 py-1">
          <Ionicons name="trash-outline" size={14} color="#ef4444" />
          <Text className="text-xs font-medium text-destructive">Remove</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AddRowButton({ onPress, disabled, label }: { onPress: () => void; disabled?: boolean; label: string }) {
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      onPress={onPress}
      className={["flex-row items-center justify-center gap-1.5 rounded-lg border border-dashed border-input py-2.5", disabled ? "opacity-50" : ""].join(" ")}
    >
      <Ionicons name="add" size={16} color="#2563eb" />
      <Text className="text-sm font-medium text-primary">{label}</Text>
    </Pressable>
  );
}

const DEFAULT_COLUMNS: GridColumn[] = [
  { key: "col1", label: "Value", type: "text" },
];

export function GridField({ field, value, onChange, disabled, error }: FieldComponentProps) {
  const schema = field.config?.grid_schema as { columns?: GridColumn[]; min_rows?: number; max_rows?: number; allow_add?: boolean } | undefined;
  const columns = schema?.columns?.length ? schema.columns : DEFAULT_COLUMNS;
  const minRows = schema?.min_rows ?? 0;
  const maxRows = schema?.max_rows ?? 50;
  const allowAdd = schema?.allow_add !== false;
  const rows: Row[] = Array.isArray(value) && value.length > 0 ? (value as Row[]) : [{}];

  function updateRow(index: number, key: string, cellValue: unknown) {
    const next = rows.map((r, i) => (i === index ? { ...r, [key]: cellValue } : r));
    onChange(next);
  }
  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...rows, {}]);
  }

  return (
    <FieldFrame field={field} error={error}>
      <View className="gap-2">
        {rows.map((row, index) => (
          <RowCard key={index} removable={!disabled && rows.length > minRows} onRemove={() => removeRow(index)}>
            {columns.map((col) => (
              <TextCell
                key={col.key}
                label={col.label}
                value={row[col.key]}
                keyboardType={col.type === "number" ? "numeric" : "default"}
                disabled={disabled}
                onChange={(t) => updateRow(index, col.key, col.type === "number" ? (t === "" ? "" : Number(t)) : t)}
              />
            ))}
          </RowCard>
        ))}
        {!disabled && allowAdd && rows.length < maxRows ? (
          <AddRowButton onPress={addRow} label="Add row" />
        ) : null}
      </View>
    </FieldFrame>
  );
}

const PRESCRIPTION_COLUMNS: GridColumn[] = [
  { key: "medicine", label: "Medicine", type: "text" },
  { key: "dose", label: "Dose", type: "text" },
  { key: "frequency", label: "Frequency", type: "text" },
  { key: "days", label: "Days", type: "number" },
  { key: "instruction", label: "Instruction", type: "text" },
];

export function PrescriptionGridField({ field, value, onChange, disabled, error }: FieldComponentProps) {
  const schema = field.config?.grid_schema as { columns?: GridColumn[]; max_rows?: number } | undefined;
  const columns = schema?.columns?.length ? schema.columns : PRESCRIPTION_COLUMNS;
  const maxRows = schema?.max_rows ?? 50;
  const rows: Row[] = Array.isArray(value) && value.length > 0 ? (value as Row[]) : [{}];

  function updateRow(index: number, key: string, cellValue: unknown) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [key]: cellValue } : r)));
  }
  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...rows, { row_id: randomRowId() }]);
  }

  return (
    <FieldFrame field={field} error={error}>
      <View className="gap-2">
        {rows.map((row, index) => (
          <RowCard key={String(row.row_id ?? index)} removable={!disabled && rows.length > 1} onRemove={() => removeRow(index)}>
            {columns.map((col) => (
              <TextCell
                key={col.key}
                label={col.label}
                value={row[col.key]}
                keyboardType={col.type === "number" ? "numeric" : "default"}
                disabled={disabled}
                onChange={(t) => updateRow(index, col.key, col.type === "number" ? (t === "" ? "" : Number(t)) : t)}
              />
            ))}
          </RowCard>
        ))}
        {!disabled && rows.length < maxRows ? <AddRowButton onPress={addRow} label="Add medicine" /> : null}
      </View>
    </FieldFrame>
  );
}

function InvestigationSearchCell({
  row,
  onPick,
  disabled,
}: {
  row: Row;
  onPick: (option: InvestigationOption) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState(String(row.investigation_name ?? ""));
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<InvestigationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(String(row.investigation_name ?? ""));
  }, [row.investigation_name]);

  function handleQueryChange(text: string) {
    setQuery(text);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchInvestigations(text.trim()));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }

  return (
    <View className="w-full gap-1">
      <Text className="text-xs font-medium text-muted-foreground">Investigation</Text>
      <TextInput
        value={query}
        onChangeText={handleQueryChange}
        onFocus={() => setOpen(true)}
        editable={!disabled}
        placeholder="Search investigations…"
        placeholderTextColor="#94a3b8"
        className="h-10 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
      />
      {open && (loading || results.length > 0) ? (
        <View className="rounded-md border border-border bg-popover overflow-hidden">
          {loading ? (
            <View className="p-2">
              <ActivityIndicator size="small" />
            </View>
          ) : (
            results.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  onPick(item);
                  setQuery(item.name);
                  setOpen(false);
                }}
                className="px-3 py-2 border-b border-border active:bg-accent"
              >
                <Text className="text-sm text-popover-foreground">{item.name}</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

export function InvestigationGridField({ field, value, onChange, disabled, error }: FieldComponentProps) {
  const schema = field.config?.grid_schema as { max_rows?: number } | undefined;
  const maxRows = schema?.max_rows ?? 50;
  const rows: Row[] = Array.isArray(value) && value.length > 0 ? (value as Row[]) : [{ row_id: randomRowId() }];

  function updateRow(index: number, patch: Row) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...rows, { row_id: randomRowId() }]);
  }

  return (
    <FieldFrame field={field} error={error}>
      <View className="gap-2">
        {rows.map((row, index) => (
          <RowCard key={String(row.row_id ?? index)} removable={!disabled && rows.length > 1} onRemove={() => removeRow(index)}>
            <InvestigationSearchCell
              row={row}
              disabled={disabled}
              onPick={(opt) =>
                updateRow(index, { investigation_id: opt.id, investigation_name: opt.name })
              }
            />
            <TextCell
              label="Notes"
              value={row.notes}
              disabled={disabled}
              onChange={(t) => updateRow(index, { notes: t })}
            />
          </RowCard>
        ))}
        {!disabled && rows.length < maxRows ? <AddRowButton onPress={addRow} label="Add investigation" /> : null}
      </View>
    </FieldFrame>
  );
}
