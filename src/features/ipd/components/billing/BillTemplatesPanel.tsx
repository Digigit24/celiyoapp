import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Button, useToast } from "../../../../components/ui";
import { useApplyBillTemplate, useBillTemplates, useCreateBillTemplateFromBill } from "../../hooks";
import type { IPDBilling } from "../../../../types/ipd";

export function BillTemplatesPanel({ bill, admissionId }: { bill: IPDBilling; admissionId: number }) {
  const toast = useToast();
  const [mode, setMode] = useState<"none" | "apply" | "save">("none");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const templates = useBillTemplates(mode === "apply" ? search : undefined);
  const applyTemplate = useApplyBillTemplate(admissionId);
  const saveTemplate = useCreateBillTemplateFromBill(admissionId);

  const nonBedItemCount = bill.items.filter((i) => i.source !== "Bed").length;
  const locked = bill.payment_status === "paid";

  if (locked) return null;

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            title="Apply Template"
            variant="outline"
            size="sm"
            onPress={() => setMode(mode === "apply" ? "none" : "apply")}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Save as Template"
            variant="outline"
            size="sm"
            disabled={nonBedItemCount === 0}
            onPress={() => setMode(mode === "save" ? "none" : "save")}
          />
        </View>
      </View>

      {mode === "apply" ? (
        <View className="gap-2 rounded-lg border border-border bg-card p-3">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search templates…"
            placeholderTextColor="#94a3b8"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
          {templates.isLoading ? (
            <ActivityIndicator />
          ) : (templates.data ?? []).length === 0 ? (
            <Text className="text-sm text-muted-foreground py-2">No templates found.</Text>
          ) : (
            (templates.data ?? []).map((item) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  applyTemplate.mutate(
                    { templateId: item.id, bill: bill.id },
                    {
                      onSuccess: () => {
                        toast.show("Template applied", "success");
                        setMode("none");
                      },
                      onError: () => toast.show("Couldn't apply the template", "error"),
                    }
                  )
                }
                className="py-2.5 border-b border-border active:bg-accent"
              >
                <Text className="text-sm font-medium text-foreground">{item.name}</Text>
                <Text className="text-xs text-muted-foreground">{item.item_count} item(s)</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}

      {mode === "save" ? (
        <View className="gap-2 rounded-lg border border-border bg-card p-3">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Template name"
            placeholderTextColor="#94a3b8"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optional)"
            placeholderTextColor="#94a3b8"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
          />
          <Button
            title="Save"
            size="sm"
            disabled={!name.trim()}
            loading={saveTemplate.isPending}
            onPress={() =>
              saveTemplate.mutate(
                { bill: bill.id, name: name.trim(), description: description.trim() || undefined },
                {
                  onSuccess: () => {
                    toast.show("Template saved", "success");
                    setMode("none");
                    setName("");
                    setDescription("");
                  },
                  onError: () => toast.show("Couldn't save the template", "error"),
                }
              )
            }
          />
        </View>
      ) : null}
    </View>
  );
}
