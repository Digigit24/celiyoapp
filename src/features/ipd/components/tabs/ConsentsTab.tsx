import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, EmptyState, useToast } from "../../../../components/ui";
import { useDocumentTemplates } from "../../hooks";
import { printDocumentsBatch } from "../../../../lib/printing";
import type { DocumentType } from "../../../../types/ipd";

const DOC_TABS: Array<{ key: DocumentType; label: string }> = [
  { key: "consent", label: "Consents" },
  { key: "stationery", label: "Stationery" },
];
const LANGUAGES: Array<{ key: "en" | "mr"; label: string }> = [
  { key: "en", label: "English" },
  { key: "mr", label: "Marathi" },
];

export function ConsentsTab({ admissionId }: { admissionId: number }) {
  const toast = useToast();
  const [docType, setDocType] = useState<DocumentType>("consent");
  const [language, setLanguage] = useState<"en" | "mr">("en");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [printing, setPrinting] = useState(false);

  const templates = useDocumentTemplates(docType);

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function handlePrint() {
    if (selected.size === 0) return;
    setPrinting(true);
    try {
      await printDocumentsBatch({
        templateCodes: Array.from(selected),
        encounterType: "ipd_admission",
        encounterId: admissionId,
        language,
        letterhead: true,
      });
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Print failed", "error");
    } finally {
      setPrinting(false);
    }
  }

  const list = templates.data ?? [];
  const allSelected = list.length > 0 && list.every((t) => selected.has(t.code));

  return (
    <View className="flex-1">
      <View className="flex-row gap-2 px-4 pt-3">
        {DOC_TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => {
              setDocType(t.key);
              setSelected(new Set());
            }}
            className={["px-3 py-1.5 rounded-full", docType === t.key ? "bg-primary" : "bg-secondary"].join(" ")}
          >
            <Text className={["text-sm font-medium", docType === t.key ? "text-primary-foreground" : "text-secondary-foreground"].join(" ")}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row gap-2">
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.key}
              onPress={() => setLanguage(l.key)}
              className={["px-2.5 py-1 rounded-full border", language === l.key ? "border-primary" : "border-input"].join(" ")}
            >
              <Text className={["text-xs font-medium", language === l.key ? "text-primary" : "text-muted-foreground"].join(" ")}>
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => setSelected(allSelected ? new Set() : new Set(list.map((t) => t.code)))}
        >
          <Text className="text-xs font-medium text-primary">{allSelected ? "Clear all" : "Select all"}</Text>
        </Pressable>
      </View>

      {templates.isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : list.length === 0 ? (
        <EmptyState icon="document-text-outline" title="No templates" />
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 16 }}>
          {list.map((t) => {
            const checked = selected.has(t.code);
            return (
              <Pressable
                key={t.code}
                onPress={() => toggle(t.code)}
                className="flex-row items-center gap-3 py-3 border-b border-border"
              >
                <View className={["h-5 w-5 rounded border items-center justify-center", checked ? "bg-primary border-primary" : "border-input"].join(" ")}>
                  {checked ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{t.name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {t.code} · {t.languages.join("/")}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View className="px-4 py-3 border-t border-border">
        <Button
          title={printing ? "Preparing…" : `Print selected (${selected.size})`}
          onPress={handlePrint}
          disabled={selected.size === 0}
          loading={printing}
        />
      </View>
    </View>
  );
}
