import React, { useCallback, useEffect, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Text, View } from "react-native";
import { Badge, Button, Card, Input, ListItem, useToast, type BadgeVariant } from "../../../../components/ui";
import {
  checkAssistantBackendStatus,
  clearAssistantBaseUrlOverride,
  DEFAULT_ASSISTANT_BASE_URL,
  getAssistantBaseUrl,
  setAssistantBaseUrlOverride,
  type AssistantBackendStatus,
} from "../../../assistant/lib/assistantSettings";

const STATUS_COPY: Record<AssistantBackendStatus, { label: string; variant: BadgeVariant; hint: string }> = {
  checking: { label: "Checking…", variant: "secondary", hint: "Contacting the assistant backend…" },
  configured: {
    label: "Configured",
    variant: "success",
    hint: "This backend has completed admin setup and is ready to use.",
  },
  unconfigured: {
    label: "Needs setup",
    variant: "warning",
    hint: "This backend is reachable but hasn't been configured yet -- open the admin panel to finish setup.",
  },
  unreachable: {
    label: "Unreachable",
    variant: "destructive",
    hint: "Couldn't reach this URL. Check the address and that the device is on the same network.",
  },
};

/**
 * Onboarding-equivalent of @digitech/hermes-chat's web admin panel, adapted
 * for mobile: the one thing that's actually mobile-specific (the backend
 * URL, which changes whenever the dev machine's network address changes --
 * a real pain point this session) is editable here; everything else
 * (backend mode, branding, TeamOS login) still happens through the web
 * admin panel itself, opened via the button below.
 */
export function AssistantSettingsTab() {
  const toast = useToast();
  const [urlInput, setUrlInput] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<AssistantBackendStatus>("checking");

  const refreshStatus = useCallback(async (url: string) => {
    setStatus("checking");
    const result = await checkAssistantBackendStatus(url);
    setStatus(result);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAssistantBaseUrl().then((url) => {
      if (cancelled) return;
      setUrlInput(url);
      setSavedUrl(url);
      void refreshStatus(url);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshStatus]);

  const isOverridden = savedUrl !== null && savedUrl !== DEFAULT_ASSISTANT_BASE_URL;
  const hasUnsavedChanges = savedUrl !== null && urlInput.trim().replace(/\/+$/, "") !== savedUrl;

  const handleSave = async () => {
    const trimmed = urlInput.trim();
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      toast.show("Enter a full URL starting with http:// or https://", "error");
      return;
    }
    setSaving(true);
    try {
      await setAssistantBaseUrlOverride(trimmed);
      const effective = await getAssistantBaseUrl();
      setSavedUrl(effective);
      setUrlInput(effective);
      toast.show("Assistant backend URL saved.", "success");
      await refreshStatus(effective);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await clearAssistantBaseUrlOverride();
    setUrlInput(DEFAULT_ASSISTANT_BASE_URL);
    setSavedUrl(DEFAULT_ASSISTANT_BASE_URL);
    toast.show("Reset to the default assistant backend.", "info");
    void refreshStatus(DEFAULT_ASSISTANT_BASE_URL);
  };

  const handleOpenAdmin = () => {
    if (!savedUrl) return;
    Linking.openURL(`${savedUrl}/admin`).catch(() => {
      toast.show("Couldn't open the admin panel URL.", "error");
    });
  };

  const statusCopy = STATUS_COPY[status];

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-card-foreground">Backend status</Text>
            <Badge label={statusCopy.label} variant={statusCopy.variant} />
          </View>
          <Text className="text-xs text-muted-foreground">{statusCopy.hint}</Text>
        </Card>

        <Card className="gap-3">
          <Text className="text-sm font-semibold text-card-foreground">Assistant backend URL</Text>
          <Text className="text-xs text-muted-foreground">
            The AI Assistant module talks to this address. It's usually your dev machine's local
            network address, so it changes when you switch networks.
          </Text>
          <Input
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder={DEFAULT_ASSISTANT_BASE_URL}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <View className="flex-row gap-2">
            <Button
              title={saving ? "Saving…" : "Save"}
              onPress={handleSave}
              loading={saving}
              disabled={!hasUnsavedChanges}
            />
            <Button title="Reset to default" variant="outline" onPress={handleReset} disabled={!isOverridden} />
          </View>
        </Card>

        <View className="rounded-2xl overflow-hidden border border-border/60">
          <ListItem
            title="Open admin panel"
            subtitle={savedUrl ? `${savedUrl}/admin` : undefined}
            leftIcon="construct-outline"
            onPress={handleOpenAdmin}
            disabled={!savedUrl}
          />
        </View>
        <Text className="text-xs text-muted-foreground px-1">
          Backend mode, branding, and TeamOS login are configured through the admin panel above --
          the first time you open it on a fresh backend, it walks you through setting an admin
          password and choosing a backend.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
