/** Save/load/delete named field-value templates for a form (e.g. a standard prescription). */
import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Button, useToast } from "../../../components/ui";
import { createFormTemplate, deleteFormTemplate, listFormTemplates } from "../../../lib/api/clinical";

interface EmrTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  formId: number;
  currentValues: Record<string, unknown>;
  onApply: (values: Record<string, unknown>) => void;
}

export function EmrTemplatesModal({ visible, onClose, formId, currentValues, onApply }: EmrTemplatesModalProps) {
  const toast = useToast();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const templates = useQuery({
    queryKey: ["clinical", "form-templates", formId],
    queryFn: () => listFormTemplates(formId),
    enabled: visible,
  });

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createFormTemplate({ form: formId, name: name.trim(), values: currentValues });
      setName("");
      await qc.invalidateQueries({ queryKey: ["clinical", "form-templates", formId] });
      toast.show("Template saved", "success");
    } catch {
      toast.show("Couldn't save the template", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteFormTemplate(id);
      await qc.invalidateQueries({ queryKey: ["clinical", "form-templates", formId] });
    } catch {
      toast.show("Couldn't delete the template", "error");
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable className="bg-popover rounded-t-2xl max-h-[80%] pb-6" onPress={(e) => e.stopPropagation()}>
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Text className="text-base font-semibold text-popover-foreground">Templates</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#64748b" />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Save current values as…"
              placeholderTextColor="#94a3b8"
              className="flex-1 h-10 rounded-md border border-input bg-card px-3 text-sm text-foreground"
            />
            <Button title="Save" size="sm" fullWidth={false} disabled={!name.trim()} loading={saving} onPress={handleSave} />
          </View>

          {templates.isLoading ? (
            <ActivityIndicator className="py-6" />
          ) : (
            <ScrollView contentContainerStyle={{ paddingVertical: 4 }}>
              {(templates.data ?? []).length === 0 ? (
                <Text className="text-sm text-muted-foreground text-center py-6">No saved templates yet.</Text>
              ) : (
                (templates.data ?? []).map((t) => (
                  <View key={t.id} className="flex-row items-center gap-2 px-4 py-3 border-b border-border">
                    <Pressable
                      className="flex-1"
                      onPress={() => {
                        onApply(t.values);
                        onClose();
                      }}
                    >
                      <Text className="text-sm font-medium text-foreground">{t.name}</Text>
                      {t.description ? <Text className="text-xs text-muted-foreground">{t.description}</Text> : null}
                    </Pressable>
                    <Pressable hitSlop={8} onPress={() => handleDelete(t.id)}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
