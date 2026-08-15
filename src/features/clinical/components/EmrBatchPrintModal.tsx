/** "Print Multiple" — merge several occurrences of a repeatable form (e.g. all round notes) into one PDF. */
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "../../../components/ui";
import { printBatch } from "../../../lib/printing";
import type { RecordOccurrence } from "../../../types/clinical";

interface EmrBatchPrintModalProps {
  visible: boolean;
  onClose: () => void;
  formCode: string;
  occurrences: RecordOccurrence[];
}

export function EmrBatchPrintModal({ visible, onClose, formCode, occurrences }: EmrBatchPrintModalProps) {
  const toast = useToast();
  const [selected, setSelected] = useState<Set<number>>(new Set(occurrences.map((o) => o.record_id)));
  const [printing, setPrinting] = useState(false);

  function toggle(recordId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  }

  async function handlePrint() {
    if (selected.size === 0) return;
    setPrinting(true);
    try {
      await printBatch(formCode, Array.from(selected));
      onClose();
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Print failed", "error");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-popover rounded-t-2xl max-h-[75%] pb-6" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-base font-semibold text-popover-foreground">Print Multiple Rounds</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {occurrences.map((occ) => {
              const checked = selected.has(occ.record_id);
              return (
                <Pressable
                  key={occ.record_id}
                  onPress={() => toggle(occ.record_id)}
                  className="flex-row items-center gap-3 py-2.5 border-b border-border"
                >
                  <View className={["h-5 w-5 rounded border items-center justify-center", checked ? "bg-primary border-primary" : "border-input"].join(" ")}>
                    {checked ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">Round {occ.occurrence_index}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {new Date(occ.created_at).toLocaleDateString()} · {occ.status}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <View className="px-4 pt-2">
            <Button
              title={printing ? "Preparing…" : `Print ${selected.size} selected`}
              onPress={handlePrint}
              disabled={selected.size === 0}
              loading={printing}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
