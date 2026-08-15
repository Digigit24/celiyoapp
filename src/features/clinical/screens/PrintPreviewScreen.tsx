/**
 * Full-screen print preview — renders the same A4-styled HTML the web app's
 * PrintPreviewModal shows in an iframe (`GET /print/preview`), fetched
 * directly rather than via WebView headers (more reliable auth handling).
 * The actual PDF (`printAndShare`, `GET /print/render`) only downloads when
 * the user taps Share — the preview itself never touches on-device PDF
 * generation, per CLAUDE.md's printing contract.
 */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../../components/ui";
import { fetchPrintPreviewHtml, printAndShare } from "../../../lib/printing";

export interface PrintPreviewRouteParams {
  formCode: string;
  recordId: number;
  title?: string;
}

/**
 * Loose navigation shape shared by every screen that navigates to
 * PrintPreview — OpdStack and IpdStack both register an identically-shaped
 * "PrintPreview" route, but callers (EmrWorkspace, BillDetailCard,
 * DischargeTab) are shared across both stacks, so they can't target either
 * ParamList specifically.
 */
export interface PrintPreviewNavigation {
  navigate: (screen: "PrintPreview", params: PrintPreviewRouteParams) => void;
}

interface Props {
  route: { params: PrintPreviewRouteParams };
  navigation: { goBack: () => void };
}

export function PrintPreviewScreen({ route, navigation }: Props) {
  const { formCode, recordId, title } = route.params;
  const toast = useToast();
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPrintPreviewHtml(formCode, recordId)
      .then((doc) => {
        if (!cancelled) setHtml(doc);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load the print preview.");
      });
    return () => {
      cancelled = true;
    };
  }, [formCode, recordId]);

  async function handleShare() {
    setSharing(true);
    try {
      await printAndShare(formCode, recordId);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Print failed", "error");
    } finally {
      setSharing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-3 py-2.5 border-b border-border bg-card">
        <Pressable accessibilityRole="button" onPress={navigation.goBack} hitSlop={8} className="h-10 w-10 items-center justify-center">
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>
        <Text className="flex-1 text-base font-semibold text-foreground text-center" numberOfLines={1}>
          {title ?? "Print Preview"}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={handleShare}
          disabled={sharing || !html}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center"
        >
          {sharing ? <ActivityIndicator size="small" /> : <Ionicons name="share-outline" size={22} color="#0f172a" />}
        </Pressable>
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-sm text-destructive text-center">{error}</Text>
        </View>
      ) : !html ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <View className="flex-1 bg-[#e5e7eb]">
          <WebView
            source={{ html }}
            originWhitelist={["*"]}
            className="flex-1"
            startInLoadingState
            renderLoading={() => (
              <View className="absolute inset-0 items-center justify-center bg-background">
                <ActivityIndicator size="large" />
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
