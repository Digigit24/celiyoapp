/**
 * AI-assisted discharge summary — generate/review/approve. Ported from
 * celiyohms's DischargePacketPanel. The web version's "Print All Discharge
 * Papers" composes an ad-hoc HTML print job client-side (window.open +
 * document.write) with no RN equivalent worth building; printing the
 * `admission_form` (which already embeds discharge_date/discharge_summary,
 * per the original Phase-2 research) is the mobile substitute — wired from
 * DischargeTab, not here.
 */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Card, useToast } from "../../../components/ui";
import { useDischargePacket, useGenerateDischargePacket, useUpdateDischargePacket } from "../hooks";
import type { DischargePacketStatus } from "../../../types/ipd";

const STATUS_VARIANT: Record<DischargePacketStatus, "secondary" | "default" | "success"> = {
  draft: "secondary",
  generated: "default",
  approved: "success",
};

function sectionValueText(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

export function DischargePacketPanel({ admissionId }: { admissionId: number }) {
  const toast = useToast();
  const packet = useDischargePacket(admissionId);
  const generate = useGenerateDischargePacket();
  const update = useUpdateDischargePacket();
  const [narrative, setNarrative] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (packet.data) setNarrative(packet.data.narrative);
  }, [packet.data]);

  if (packet.isLoading) {
    return <ActivityIndicator className="py-4" />;
  }
  if (!packet.data) return null;

  const p = packet.data;

  function toggleSection(recordId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  }

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-foreground">Discharge summary</Text>
        <View className="flex-row items-center gap-2">
          <Badge label={p.status} variant={STATUS_VARIANT[p.status]} />
          {p.ai_model ? <Text className="text-xs text-muted-foreground">{p.ai_model}</Text> : null}
        </View>
      </View>
      <Text className="text-xs text-muted-foreground mt-1">{p.sections.length} synced section(s)</Text>

      <View className="mt-3">
        <Button
          title={p.status === "draft" ? "Generate with AI" : "Regenerate with AI"}
          variant="outline"
          size="sm"
          loading={generate.isPending}
          onPress={() =>
            generate.mutate(admissionId, {
              onError: () => toast.show("AI discharge summary generation failed", "error"),
            })
          }
        />
      </View>

      <TextInput
        value={narrative}
        onChangeText={setNarrative}
        multiline
        placeholder="Discharge narrative…"
        placeholderTextColor="#94a3b8"
        className="mt-3 min-h-[120px] rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground"
        textAlignVertical="top"
      />

      <View className="flex-row gap-2 mt-3">
        <View className="flex-1">
          <Button
            title="Save Draft"
            variant="outline"
            size="sm"
            disabled={!narrative.trim()}
            loading={update.isPending}
            onPress={() =>
              update.mutate(
                { admissionId, payload: { narrative, approved: false } },
                {
                  onSuccess: () => toast.show("Discharge summary saved", "success"),
                  onError: () => toast.show("Couldn't save the summary", "error"),
                }
              )
            }
          />
        </View>
        <View className="flex-1">
          <Button
            title="Approve"
            size="sm"
            disabled={!narrative.trim()}
            loading={update.isPending}
            onPress={() =>
              update.mutate(
                { admissionId, payload: { narrative, approved: true } },
                {
                  onSuccess: () => toast.show("Discharge summary approved", "success"),
                  onError: () => toast.show("Couldn't approve the summary", "error"),
                }
              )
            }
          />
        </View>
      </View>

      {p.sections.length > 0 ? (
        <View className="mt-3 gap-2">
          {p.sections.map((section) => {
            const open = expanded.has(section.record_id);
            return (
              <View key={`${section.record_id}-${section.section_id}`} className="rounded-lg border border-border">
                <Pressable
                  onPress={() => toggleSection(section.record_id)}
                  className="flex-row items-center justify-between px-3 py-2.5"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{section.section_title}</Text>
                    <Text className="text-xs text-muted-foreground">{section.form_name}</Text>
                  </View>
                  <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
                </Pressable>
                {open ? (
                  <View className="px-3 pb-2.5 gap-1">
                    {section.values.map((v) => (
                      <View key={v.field_key} className="flex-row justify-between">
                        <Text className="text-xs text-muted-foreground flex-1">{v.label}</Text>
                        <Text className="text-xs text-foreground flex-1 text-right">{sectionValueText(v.value)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}
