/**
 * WhatsApp chat tab — ported from celiyohms's WhatsAppTab. Talks directly to
 * digicrm (crm.celiyo.com) since this app has no BFF; see whatsapp.ts for
 * the vendor-credential handling. Message bodies from the Laravel adapter
 * are loosely typed (see types/whatsapp.ts) — this renderer is defensive
 * about shape, matching the web client's own defensive reads.
 */
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState, useToast } from "../../../../components/ui";
import { useSendWhatsAppText, useWhatsAppChat } from "../../../whatsapp/hooks";
import { normalizeChatMessages, isReplyWindowOpen } from "../../../../lib/api/whatsapp";
import type { ChatMessage } from "../../../../types/whatsapp";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.length >= 8 ? digits : null;
}

function parseMessageBody(msg: ChatMessage): { text: string; mediaUrl?: string } {
  const raw = msg.message ?? msg.text ?? "";
  if (!raw) return { text: "" };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (typeof obj.text === "string" && (!obj.type || obj.type === "text")) return { text: obj.text };
      const url = typeof obj.url === "string" ? obj.url : typeof obj.link === "string" ? obj.link : undefined;
      if (url) return { text: typeof obj.caption === "string" ? obj.caption : "", mediaUrl: url };
      return { text: raw };
    }
  } catch {
    // plain text, not JSON
  }
  return { text: raw };
}

function templateName(msg: ChatMessage): string | null {
  return msg.meta?.template_name ?? msg.template_name ?? null;
}

function statusTick(status: string) {
  const s = status.toLowerCase();
  if (s === "failed") return <Ionicons name="alert-circle" size={13} color="#ef4444" />;
  if (s === "read") return <Ionicons name="checkmark-done" size={13} color="#0ea5e9" />;
  if (s === "delivered") return <Ionicons name="checkmark-done" size={13} color="#94a3b8" />;
  return <Ionicons name="checkmark" size={13} color="#94a3b8" />;
}

function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function Bubble({ message }: { message: ChatMessage }) {
  const outbound = message.direction === "outbound";
  const { text, mediaUrl } = parseMessageBody(message);
  const template = templateName(message);
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View className={["max-w-[80%] mb-2", outbound ? "self-end items-end" : "self-start items-start"].join(" ")}>
      <View
        className={[
          "rounded-2xl px-3 py-2",
          outbound ? "bg-emerald-600 rounded-tr-sm" : "bg-secondary rounded-tl-sm",
        ].join(" ")}
      >
        {template ? (
          <Text className={["text-[10px] font-semibold mb-1", outbound ? "text-emerald-100" : "text-muted-foreground"].join(" ")}>
            Template: {template}
          </Text>
        ) : null}
        {mediaUrl ? (
          <Pressable onPress={() => Linking.openURL(mediaUrl)}>
            <Image source={{ uri: mediaUrl }} className="h-40 w-56 rounded-lg mb-1" resizeMode="cover" />
          </Pressable>
        ) : null}
        {text ? (
          <Text className={outbound ? "text-white" : "text-foreground"}>{text}</Text>
        ) : !mediaUrl ? (
          <Text className={outbound ? "text-emerald-100 italic" : "text-muted-foreground italic"}>
            (unsupported message)
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1 mt-0.5">
        <Text className="text-[10px] text-muted-foreground">{time}</Text>
        {outbound ? statusTick(message.status) : null}
      </View>
    </View>
  );
}

export function WhatsAppTab({ phone, patientName }: { phone: string | null; patientName: string }) {
  const toast = useToast();
  const normalized = phone ? normalizePhone(phone) : null;
  const chat = useWhatsAppChat(normalized);
  const sendText = useSendWhatsAppText(normalized ?? "");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const messages = useMemo(() => (chat.data ? normalizeChatMessages(chat.data) : []), [chat.data]);
  const windowOpen = chat.data ? isReplyWindowOpen(chat.data) : false;

  const grouped = useMemo(() => {
    const groups: Array<{ label: string; items: ChatMessage[] }> = [];
    for (const msg of messages) {
      const label = dayLabel(new Date(msg.timestamp));
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(msg);
      else groups.push({ label, items: [msg] });
    }
    return groups;
  }, [messages]);

  if (!normalized) {
    return <EmptyState icon="logo-whatsapp" title="No phone number on file" />;
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) return;
    setDraft(text);
    sendText.mutate(
      { text, name: patientName },
      {
        onSuccess: () => setDraft(""),
        onError: (err) => {
          toast.show(err instanceof Error ? err.message : "Failed to send message", "error");
        },
      }
    );
  }

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-border">
        <View className={["rounded-full px-2.5 py-1", windowOpen ? "bg-emerald-100 dark:bg-emerald-950" : "bg-amber-100 dark:bg-amber-950"].join(" ")}>
          <Text className={["text-xs font-medium", windowOpen ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"].join(" ")}>
            {windowOpen ? "24h window open" : "Window closed"}
          </Text>
        </View>
        <Text className="text-xs font-mono text-muted-foreground">{normalized}</Text>
        <Pressable onPress={() => chat.refetch()} hitSlop={8}>
          <Ionicons name="refresh" size={18} color="#0f172a" />
        </Pressable>
      </View>

      {chat.isLoading ? (
        <ActivityIndicator className="mt-6" />
      ) : messages.length === 0 ? (
        <EmptyState icon="chatbubble-outline" title="No messages yet" />
      ) : (
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {grouped.map((group) => (
            <View key={group.label}>
              <View className="items-center my-2">
                <View className="rounded-full bg-secondary px-2.5 py-1">
                  <Text className="text-[11px] font-medium text-secondary-foreground">{group.label}</Text>
                </View>
              </View>
              {group.items.map((msg) => (
                <Bubble key={msg.id} message={msg} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      <View className="px-4 py-3 border-t border-border gap-1.5">
        {!windowOpen ? (
          <Text className="text-xs text-muted-foreground">
            The 24-hour reply window is closed — only approved templates can be sent until the patient messages again.
          </Text>
        ) : null}
        <View className="flex-row items-center gap-2">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={windowOpen}
            placeholder={windowOpen ? "Type a message…" : "Reply window closed"}
            placeholderTextColor="#94a3b8"
            multiline
            className={["flex-1 max-h-24 rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground", !windowOpen ? "opacity-50" : ""].join(" ")}
          />
          <Pressable
            onPress={handleSend}
            disabled={!windowOpen || !draft.trim() || sendText.isPending}
            className={["h-11 w-11 items-center justify-center rounded-full", windowOpen && draft.trim() ? "bg-primary" : "bg-muted"].join(" ")}
          >
            {sendText.isPending ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="send" size={18} color="#ffffff" />}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
