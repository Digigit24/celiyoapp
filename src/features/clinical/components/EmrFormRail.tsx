import React, { useMemo } from "react";
import { Modal, Pressable, SectionList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { EncounterFormState } from "../../../types/clinical";

/** Mirrors celiyohms's EmrFormRail groupLabel heuristic. */
function groupLabel(code: string): string {
  const c = code.toLowerCase();
  if (c.includes("operative") || c.includes("surgery")) return "Operative";
  if (c.includes("discharge")) return "Discharge Papers";
  if (c.includes("incident") || c.includes("mrd")) return "Incident / MRD";
  if (c.includes("consent") || c.includes("document")) return "Documents";
  return "Clinical";
}

interface EmrFormRailProps {
  visible: boolean;
  onClose: () => void;
  forms: EncounterFormState[];
  activeFormCode: string;
  onSelect: (formCode: string) => void;
}

export function EmrFormRail({ visible, onClose, forms, activeFormCode, onSelect }: EmrFormRailProps) {
  const sections = useMemo(() => {
    const groups = new Map<string, EncounterFormState[]>();
    for (const state of forms) {
      const label = groupLabel(state.form.code);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(state);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [forms]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-popover rounded-t-2xl max-h-[80%] pb-6" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-base font-semibold text-popover-foreground">Forms</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.form.code}
            renderSectionHeader={({ section }) => (
              <View className="bg-popover px-4 pt-3 pb-1">
                <Text className="text-xs font-semibold uppercase text-muted-foreground">{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const active = item.form.code === activeFormCode;
              return (
                <Pressable
                  onPress={() => onSelect(item.form.code)}
                  className={["flex-row items-center gap-3 px-4 py-3 border-b border-border active:bg-accent", active ? "bg-accent" : ""].join(" ")}
                >
                  <Ionicons
                    name={item.filled ? "checkmark-circle" : "ellipse-outline"}
                    size={18}
                    color={item.filled ? "#2563eb" : "#94a3b8"}
                  />
                  <Text className="flex-1 text-base text-popover-foreground" numberOfLines={1}>
                    {item.form.name}
                  </Text>
                  {item.record_status ? (
                    <Text className="text-xs text-muted-foreground">{item.record_status}</Text>
                  ) : null}
                </Pressable>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
