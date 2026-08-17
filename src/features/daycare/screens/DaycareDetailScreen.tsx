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
  DAYCARE_SESSION_TYPE_LABELS,
  DAYCARE_STATUS_CHIP_VARIANT,
  DAYCARE_STATUS_LABELS,
  DEMO_DAYCARE_QUICK_STATS,
  formatDaycareDate,
} from "../constants";
import { useDaycareSession } from "../hooks";
import type { DaycareStackParamList } from "./DaycareListScreen";

type Props = NativeStackScreenProps<DaycareStackParamList, "DaycareDetail">;

export function DaycareDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const { data: session, isLoading } = useDaycareSession(sessionId);

  useLayoutEffect(() => {
    if (session) {
      navigation.setOptions({
        title: session.sessionRef,
        headerRight: () => (
          <View className="pr-1">
            <Chip
              label={DAYCARE_STATUS_LABELS[session.status]}
              variant={DAYCARE_STATUS_CHIP_VARIANT[session.status]}
            />
          </View>
        ),
      });
    }
  }, [navigation, session]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-base font-semibold text-foreground">
          Session not found
        </Text>
        <Text className="mt-1 text-sm text-muted-foreground text-center">
          The daycare session may have been rescheduled or removed. Try going
          back to the list.
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
            <Avatar source={session.patientName} size="lg" />
            <View className="flex-1 gap-1">
              <Text
                className="text-base font-semibold text-foreground"
                numberOfLines={1}
              >
                {session.patientName}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {session.patientId} · {session.sessionRef}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Chip
                  label={DAYCARE_STATUS_LABELS[session.status]}
                  variant={DAYCARE_STATUS_CHIP_VARIANT[session.status]}
                />
                <Chip
                  label={DAYCARE_SESSION_TYPE_LABELS[session.sessionType]}
                  variant="neutral"
                />
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Date" value={formatDaycareDate(session.date)} />
            <KeyValueRow label="Time slot" value={session.timeSlot} />
            <KeyValueRow label="Bed / chair" value={session.bedOrChair} />
            <KeyValueRow
              label="Attending doctor"
              value={session.attendingDoctor}
              action={{ icon: "call-outline", onPress: () => {}, label: "Call doctor" }}
            />
          </View>
        </Card>
      </View>

      {/* Quick stats — 2x2 grid of aggregate numbers */}
      <View className="px-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <StatTile
              icon="today-outline"
              label="Today"
              value={String(DEMO_DAYCARE_QUICK_STATS.todaySessions)}
              tint="blue"
              hint="Sessions scheduled today"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="pulse-outline"
              label="In progress"
              value={String(DEMO_DAYCARE_QUICK_STATS.inProgress)}
              tint="amber"
              hint="Currently checked in"
            />
          </View>
        </View>
        <View className="flex-row gap-2 mt-2">
          <View className="flex-1">
            <StatTile
              icon="checkmark-circle-outline"
              label="Completed"
              value={String(DEMO_DAYCARE_QUICK_STATS.completedThisWeek)}
              tint="emerald"
              hint="This week"
            />
          </View>
          <View className="flex-1">
            <StatTile
              icon="close-circle-outline"
              label="Cancelled"
              value={String(DEMO_DAYCARE_QUICK_STATS.cancelledThisWeek)}
              tint="rose"
              hint="This week"
            />
          </View>
        </View>
      </View>

      {/* Session notes */}
      <View>
        <SectionHeader title="Session notes" />
        <View className="px-4">
          <Card>
            <Text className="text-sm leading-relaxed text-foreground">
              {session.notes}
            </Text>
          </Card>
        </View>
      </View>

      {/* Pre-session vitals snapshot */}
      <View>
        <SectionHeader title="Pre-session vitals" />
        <View className="px-4">
          <Card padded={false}>
            {session.vitals ? (
              <View className="px-1">
                <KeyValueRow label="Blood pressure" value={session.vitals.bp} />
                <KeyValueRow label="Pulse" value={`${session.vitals.pulse} bpm`} />
                <KeyValueRow label="Temperature" value={session.vitals.temp} />
                {session.vitals.spo2 ? (
                  <KeyValueRow label="SpO2" value={session.vitals.spo2} />
                ) : null}
                <KeyValueRow label="Recorded at" value={session.vitals.recordedAt} />
              </View>
            ) : (
              <View className="flex-row items-center gap-3 p-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Ionicons name="hourglass-outline" size={18} color="#64748b" />
                </View>
                <Text className="flex-1 text-sm text-muted-foreground">
                  Vitals not yet recorded — will be captured at check-in.
                </Text>
              </View>
            )}
          </Card>
        </View>
      </View>

      {/* Status timeline */}
      <View>
        <SectionHeader
          title="Status timeline"
          count={`${session.timeline.length} event${session.timeline.length === 1 ? "" : "s"}`}
        />
        <View className="px-4">
          <Card padded={false}>
            <View className="p-4">
              {session.timeline.map((event, i) => (
                <TimelineRow
                  key={`${event.title}-${i}`}
                  title={event.title}
                  subtitle={event.subtitle}
                  when={event.when}
                  tint={event.tint}
                  icon={event.icon}
                  isLast={i === session.timeline.length - 1}
                />
              ))}
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
