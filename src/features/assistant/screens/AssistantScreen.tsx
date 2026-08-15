import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
// A streaming-capable fetch (real ReadableStream body) -- used instead of RN's
// built-in fetch, which can't read a streaming response (see
// @digitech/hermes-chat-native's README for why this matters here).
import { fetch as expoFetch } from "expo/fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { HermesChatNative } from "@digitech/hermes-chat-native";
import { useAuth } from "../../../store/AuthContext";
import { getAssistantBaseUrl } from "../lib/assistantSettings";

const CONVERSATION_ID_KEY_PREFIX = "assistant-conversation-id:";

/**
 * AI Assistant module. Talks to @digitech/hermes-chat's route handlers at
 * whatever URL Settings > Assistant currently resolves (a user override, or
 * the built-in default from src/lib/config.ts) -- the same backend the web
 * widget (assistanceu/_pkg_scratch) uses, not a mobile-specific one.
 *
 * Conversation id is persisted per-user in AsyncStorage (mirrors the web
 * widget's localStorage persistence) so a re-opened app resumes the same
 * thread instead of starting fresh every time.
 */
export function AssistantScreen() {
  const { session } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);

  const storageKey = session?.userId ? `${CONVERSATION_ID_KEY_PREFIX}${session.userId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((stored) => {
      if (cancelled) return;
      if (stored) setConversationId(stored);
      else setConversationId(`conv-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  // Re-read on every focus-worthy mount rather than once at module load --
  // Settings > Assistant can change this at any time and there's no other
  // signal (no context/store) to react to that edit.
  useEffect(() => {
    let cancelled = false;
    getAssistantBaseUrl().then((url) => {
      if (!cancelled) setBaseUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleConversationChange = (nextId: string) => {
    setConversationId(nextId);
    if (storageKey) void AsyncStorage.setItem(storageKey, nextId);
  };

  if (!session?.userId || !conversationId || !baseUrl) {
    return <SafeAreaView className="flex-1 bg-background" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <HermesChatNative
        api={`${baseUrl}/api/hermes-chat`}
        historyApi={`${baseUrl}/api/hermes-history`}
        copilotsApi={`${baseUrl}/api/hermes-copilots`}
        conversationsApi={`${baseUrl}/api/hermes-conversations`}
        conversationId={conversationId}
        onConversationChange={handleConversationChange}
        externalSubjectId={session.userId}
        brand={{ displayName: "Celiyo Assistant", accentColor: "#2563eb" }}
        fetch={expoFetch as unknown as typeof globalThis.fetch}
        adminUrl={`${baseUrl}/admin`}
      />
    </SafeAreaView>
  );
}
