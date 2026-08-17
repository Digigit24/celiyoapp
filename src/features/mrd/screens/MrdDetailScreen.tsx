import React, { useLayoutEffect } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Card,
  Chip,
  KeyValueRow,
  SectionHeader,
  StatTile,
  TimelineRow,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import {
  DEMO_MRD_QUICK_STATS,
  formatMrdDate,
  MRD_STATUS_CHIP_VARIANT,
  MRD_STATUS_LABELS,
} from "../constants";
import { useMrdFile } from "../hooks";
import type { MrdStackParamList } from "./MrdListScreen";

type Props = NativeStackScreenProps<MrdStackParamList, "MrdDetail">;

export function MrdDetailScreen({ route, navigation }: Props) {
  const { fileId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: file, isLoading } = useMrdFile(fileId);

  useLayoutEffect(() => {
    if (file) {
      navigation.setOptions({
        title: file.fileNumber,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={MRD_STATUS_LABELS[file.status]}
              variant={MRD_STATUS_CHIP_VARIANT[file.status]}
            />
          </View>
        ),
      });
    }
  }, [navigation, file]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!file) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">
          File not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The file record may have been archived or removed. Try going back
          to the list.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingBottom: TAB_BAR_CONTENT_INSET + insets.bottom + 24,
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Identity header — Avatar + name + KeyValueRow summary */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={file.patientName} size="lg" />
            <View className="flex-1 gap-1">
              <Text
                className="text-base font-semibold text-foreground"
                numberOfLines={1}
              >
                {file.patientName}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {file.patientId} · {file.fileNumber}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip
                  label={MRD_STATUS_LABELS[file.status]}
                  variant={MRD_STATUS_CHIP_VARIANT[file.status]}
                />
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Current custody" value={file.currentCustody} />
            <KeyValueRow
              label="Last movement"
              value={`${formatMrdDate(file.lastMovementDate)} · ${file.lastMovementTime}`}
            />
            <KeyValueRow label="Volumes" value={String(file.volumeCount)} />
            <KeyValueRow label="Home storage" value={file.storageLocation} />
          </View>
        </Card>
      </View>

      {/* Quick stats — 2x2 grid of aggregate numbers */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile
              icon="folder-outline"
              label="Total files"
              value={String(DEMO_MRD_QUICK_STATS.totalFiles)}
              tint="blue"
              hint="Tracked in MRD"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="arrow-redo-outline"
              label="Checked out"
              value={String(DEMO_MRD_QUICK_STATS.checkedOut)}
              tint="amber"
              hint="Currently with a department"
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="swap-horizontal-outline"
              label="In transit"
              value={String(DEMO_MRD_QUICK_STATS.inTransit)}
              tint="violet"
              hint="Between departments"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="archive-outline"
              label="Archived"
              value={String(DEMO_MRD_QUICK_STATS.archivedThisMonth)}
              tint="slate"
              hint="This month"
            />
          </View>
        </View>
      </View>

      {/* File info */}
      <View>
        <SectionHeader title="File info" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="File number" value={file.fileNumber} />
              <KeyValueRow label="Patient ID" value={file.patientId} />
              <KeyValueRow label="Volumes" value={String(file.volumeCount)} />
              <KeyValueRow label="Storage location" value={file.storageLocation} />
            </View>
          </Card>
        </View>
      </View>

      {/* Movement / custody timeline */}
      <View>
        <SectionHeader
          title="Movement history"
          count={`${file.movementTimeline.length} event${file.movementTimeline.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {file.movementTimeline.map((event, i) => (
                <TimelineRow
                  key={`${event.title}-${i}`}
                  title={event.title}
                  subtitle={event.subtitle}
                  when={event.when}
                  tint={event.tint}
                  icon={event.icon}
                  isLast={i === file.movementTimeline.length - 1}
                />
              ))}
            </View>
          </Card>
        </View>
      </View>

      {/* MRD action nudge — honest "coming soon" for check-out/return actions */}
      <View className="px-4">
        <Card>
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-amber-50">
              <Ionicons name="construct-outline" size={18} color="#92400e" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">
                Check-out / return actions coming soon
              </Text>
              <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={2}>
                Issuing, returning, and archiving files from this screen ships
                with the live MRD integration.
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}
