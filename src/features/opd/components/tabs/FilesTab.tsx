/** Visit attachments (X-ray/report/prescription files) — list + upload + delete. */
import React, { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { Button, EmptyState, useToast } from "../../../../components/ui";
import { useAttachments, useDeleteAttachment, useUploadAttachment } from "../../hooks";

const FILE_TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  xray: "image-outline",
  report: "document-text-outline",
  prescription: "medical-outline",
  scan: "scan-outline",
  document: "document-attach-outline",
  other: "attach-outline",
};

export function FilesTab({ visitId }: { visitId: number }) {
  const toast = useToast();
  const attachments = useAttachments(visitId);
  const uploadAttachment = useUploadAttachment(visitId);
  const deleteAttachment = useDeleteAttachment(visitId);
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    uploadAttachment.mutate(
      { file: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? "application/octet-stream" } },
      {
        onSuccess: () => toast.show("File uploaded", "success"),
        onError: () => toast.show("Couldn't upload the file", "error"),
        onSettled: () => setUploading(false),
      }
    );
  }

  function handleDelete(id: number) {
    deleteAttachment.mutate(id, { onError: () => toast.show("Couldn't delete the file", "error") });
  }

  if (attachments.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const list = attachments.data ?? [];

  return (
    <View className="flex-1">
      {list.length === 0 ? (
        <View className="flex-1">
          <EmptyState icon="folder-open-outline" title="No files yet" message="Upload X-rays, reports, or prescriptions." />
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 8 }}>
          {list.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => Linking.openURL(item.file)}
              className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3.5"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <Ionicons name={FILE_TYPE_ICON[item.file_type] ?? "attach-outline"} size={18} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                  {item.file_name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {item.file_type} · {new Date(item.uploaded_at).toLocaleDateString()}
                </Text>
              </View>
              <Pressable hitSlop={8} onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View className="px-4 py-3 border-t border-border bg-card">
        <Button title="Upload file" onPress={handleUpload} loading={uploading} />
      </View>
    </View>
  );
}
