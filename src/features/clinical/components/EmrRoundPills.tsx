/** Round/occurrence switcher for repeatable forms (progress notes, monitoring charts). */
import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { RecordOccurrence } from "../../../types/clinical";

interface EmrRoundPillsProps {
  occurrences: RecordOccurrence[];
  selectedRecordId: number | null;
  onSelect: (recordId: number) => void;
  onCreateNext: () => void;
  creating: boolean;
}

export function EmrRoundPills({ occurrences, selectedRecordId, onSelect, onCreateNext, creating }: EmrRoundPillsProps) {
  return (
    <View style={{ height: 44 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
        <View className="flex-row gap-2 px-4">
          {occurrences.map((occ) => {
            const active = occ.record_id === selectedRecordId;
            return (
              <Pressable
                key={occ.record_id}
                onPress={() => onSelect(occ.record_id)}
                className={["flex-row items-center gap-1.5 px-3 py-2 rounded-full", active ? "bg-primary" : "bg-secondary"].join(" ")}
              >
                {occ.is_locked ? (
                  <Ionicons name="lock-closed" size={11} color={active ? "#ffffff" : "#64748b"} />
                ) : null}
                <Text className={["text-sm font-medium", active ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
                  Round {occ.occurrence_index}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={onCreateNext}
            disabled={creating}
            className="flex-row items-center gap-1 px-3 py-2 rounded-full border border-dashed border-input"
          >
            {creating ? <ActivityIndicator size="small" /> : <Ionicons name="add" size={14} color="#2563eb" />}
            <Text className="text-sm font-medium text-primary">New Round</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
