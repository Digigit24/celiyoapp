import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { FieldFrame, resolveSourceValue, type FieldComponentProps } from "./FieldFrame";
import { usePicklistItems, useCreatePicklistItem } from "../../hooks";
import { useDoctors } from "../../../../hooks/masters";

interface Option {
  label: string;
  value: string;
}

interface Props extends FieldComponentProps {
  encounter?: Record<string, unknown>;
}

function staticOptions(field: FieldComponentProps["field"]): Option[] | null {
  const raw = field.config?.options;
  if (!Array.isArray(raw)) return null;
  return raw
    .map((o) => (o && typeof o === "object" ? o : null))
    .filter((o): o is Record<string, unknown> => o !== null)
    .map((o) => ({ label: String(o.label ?? o.value ?? ""), value: String(o.value ?? o.label ?? "") }));
}

/** Shared bottom-sheet picker used by picklist/multiselect/api_select. */
function PickerModal({
  visible,
  onClose,
  title,
  options,
  loading,
  selectedValues,
  onSelect,
  allowCreate,
  onCreate,
  creating,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: Option[];
  loading?: boolean;
  selectedValues: Set<string>;
  onSelect: (option: Option) => void;
  allowCreate?: boolean;
  onCreate?: (label: string) => void;
  creating?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);
  const exactMatch = filtered.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-popover rounded-t-2xl max-h-[75%] pb-6" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-base font-semibold text-popover-foreground">{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>
          <View className="px-4 py-2 border-b border-border">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              placeholderTextColor="#94a3b8"
              autoFocus
              className="h-10 rounded-lg border border-input bg-card px-3 text-base text-foreground"
            />
          </View>
          {loading ? (
            <Text className="px-4 py-6 text-sm text-muted-foreground">Loading…</Text>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => onSelect(item)}
                  className="flex-row items-center justify-between px-4 py-3.5 border-b border-border active:bg-accent"
                >
                  <Text className="text-base text-popover-foreground flex-1">{item.label}</Text>
                  {selectedValues.has(item.value) ? (
                    <Ionicons name="checkmark" size={18} color="#2563eb" />
                  ) : null}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text className="px-4 py-6 text-sm text-muted-foreground">No matches.</Text>
              }
              ListFooterComponent={
                allowCreate && onCreate && query.trim() && !exactMatch ? (
                  <Pressable
                    disabled={creating}
                    onPress={() => onCreate(query.trim())}
                    className="flex-row items-center gap-2 px-4 py-3.5 active:bg-accent"
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
                    <Text className="text-base text-primary">Add "{query.trim()}"</Text>
                  </Pressable>
                ) : null
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function usePicklistOptions(field: FieldComponentProps["field"]) {
  const inline = staticOptions(field);
  const embedded = field.picklist_items?.map((i) => ({ label: i.label, value: i.label }));
  const needsFetch = !inline && !embedded?.length && Boolean(field.picklist);
  const fetched = usePicklistItems(needsFetch ? field.picklist : null);
  const options = inline ?? embedded ?? fetched.data?.map((i) => ({ label: i.label, value: i.label })) ?? [];
  return { options, loading: needsFetch && fetched.isLoading };
}

export function PicklistField({ field, value, onChange, disabled, error, encounter }: Props) {
  const { hasSource, sourceValue } = resolveSourceValue(field, encounter);
  const effective = hasSource ? sourceValue : value;
  const { options, loading } = usePicklistOptions(field);
  const [open, setOpen] = useState(false);
  const createItem = useCreatePicklistItem();
  const display = effective ? String(effective) : "";

  return (
    <FieldFrame field={field} error={error}>
      <Pressable
        disabled={disabled || hasSource}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className={[
          "h-11 flex-row items-center justify-between rounded-lg border bg-card px-3",
          error ? "border-destructive" : "border-input",
          disabled || hasSource ? "opacity-50" : "",
        ].join(" ")}
      >
        <Text className={display ? "text-base text-foreground" : "text-base text-muted-foreground"} numberOfLines={1}>
          {display || field.help_text || "Select…"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </Pressable>
      <PickerModal
        visible={open}
        onClose={() => setOpen(false)}
        title={field.label}
        options={options}
        loading={loading}
        selectedValues={new Set(display ? [display] : [])}
        onSelect={(opt) => {
          onChange(opt.label);
          setOpen(false);
        }}
        allowCreate={Boolean(field.picklist)}
        creating={createItem.isPending}
        onCreate={(label) => {
          if (!field.picklist) return;
          createItem.mutate(
            { picklist: field.picklist, label },
            { onSuccess: () => onChange(label) }
          );
          setOpen(false);
        }}
      />
    </FieldFrame>
  );
}

function normalizeMultiValue(value: unknown): { selected: string[]; notes?: Record<string, string> } {
  if (Array.isArray(value)) return { selected: value.map(String) };
  if (value && typeof value === "object" && Array.isArray((value as { selected?: unknown }).selected)) {
    const obj = value as { selected: unknown[]; notes?: Record<string, string> };
    return { selected: obj.selected.map(String), notes: obj.notes };
  }
  return { selected: [] };
}

export function MultiSelectField({ field, value, onChange, disabled, error }: Props) {
  const { options, loading } = usePicklistOptions(field);
  const [open, setOpen] = useState(false);
  const createItem = useCreatePicklistItem();
  const { selected, notes } = normalizeMultiValue(value);

  function toggle(label: string) {
    const next = selected.includes(label) ? selected.filter((s) => s !== label) : [...selected, label];
    onChange(notes ? { selected: next, notes } : next);
  }

  return (
    <FieldFrame field={field} error={error}>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className={[
          "min-h-[44px] flex-row flex-wrap items-center gap-1.5 rounded-lg border bg-card px-3 py-2",
          error ? "border-destructive" : "border-input",
          disabled ? "opacity-50" : "",
        ].join(" ")}
      >
        {selected.length === 0 ? (
          <Text className="text-base text-muted-foreground">Select…</Text>
        ) : (
          selected.map((s) => (
            <View key={s} className="rounded-full bg-secondary px-2.5 py-1">
              <Text className="text-xs font-medium text-secondary-foreground">{s}</Text>
            </View>
          ))
        )}
      </Pressable>
      <PickerModal
        visible={open}
        onClose={() => setOpen(false)}
        title={field.label}
        options={options}
        loading={loading}
        selectedValues={new Set(selected)}
        onSelect={(opt) => toggle(opt.label)}
        allowCreate={Boolean(field.picklist)}
        creating={createItem.isPending}
        onCreate={(label) => {
          if (!field.picklist) return;
          createItem.mutate({ picklist: field.picklist, label }, { onSuccess: () => toggle(label) });
        }}
      />
    </FieldFrame>
  );
}

/** Only config.api === "doctors" is used by dghms forms today. */
export function ApiSelectField({ field, value, onChange, disabled, error }: Props) {
  const [open, setOpen] = useState(false);
  const doctors = useDoctors();
  const options: Option[] = (doctors.data ?? []).map((d) => ({ label: d.full_name, value: d.user_id }));
  const selectedLabel = options.find((o) => o.value === String(value ?? ""))?.label ?? "";

  return (
    <FieldFrame field={field} error={error}>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className={[
          "h-11 flex-row items-center justify-between rounded-lg border bg-card px-3",
          error ? "border-destructive" : "border-input",
          disabled ? "opacity-50" : "",
        ].join(" ")}
      >
        <Text className={selectedLabel ? "text-base text-foreground" : "text-base text-muted-foreground"} numberOfLines={1}>
          {selectedLabel || "Select doctor…"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </Pressable>
      <PickerModal
        visible={open}
        onClose={() => setOpen(false)}
        title={field.label}
        options={options}
        loading={doctors.isLoading}
        selectedValues={new Set(value ? [String(value)] : [])}
        onSelect={(opt) => {
          onChange(opt.value);
          setOpen(false);
        }}
      />
    </FieldFrame>
  );
}
