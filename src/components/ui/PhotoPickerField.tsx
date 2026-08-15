import React from "react";
import { Alert, Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface PhotoPickerFieldProps {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

/** Downsized (quality 0.5) JPEG data URL, matching web's photo_data/guardian_photo_data convention. */
async function pickFrom(source: "camera" | "library"): Promise<string | null> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Permission needed", "Allow access to continue.");
    return null;
  }
  const launch = source === "camera" ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
  const result = await launch({
    mediaTypes: ["images"],
    quality: 0.5,
    base64: true,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled || !result.assets?.[0]?.base64) return null;
  return `data:image/jpeg;base64,${result.assets[0].base64}`;
}

export function PhotoPickerField({ label, value, onChange, disabled }: PhotoPickerFieldProps) {
  function handlePress() {
    if (disabled) return;
    Alert.alert(label, undefined, [
      {
        text: "Take Photo",
        onPress: () => void pickFrom("camera").then((uri) => uri && onChange(uri)),
      },
      {
        text: "Choose from Library",
        onPress: () => void pickFrom("library").then((uri) => uri && onChange(uri)),
      },
      ...(value ? [{ text: "Remove Photo", style: "destructive" as const, onPress: () => onChange(null) }] : []),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  return (
    <View className="items-center gap-2">
      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        disabled={disabled}
        className="h-24 w-24 items-center justify-center rounded-full bg-secondary border border-border overflow-hidden"
      >
        {value ? (
          <Image source={{ uri: value }} className="h-24 w-24" resizeMode="cover" />
        ) : (
          <Ionicons name="camera-outline" size={26} color="#64748b" />
        )}
      </Pressable>
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
    </View>
  );
}
