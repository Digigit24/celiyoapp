import React, { useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  InlineError,
  Input,
  KeyValueRow,
  SectionHeader,
  useToast,
} from "../../../components/ui";
import { TAB_BAR_CONTENT_INSET } from "../../../navigation/AppDrawer";
import { useDoctors } from "../../../hooks/masters";
import {
  ADMISSION_STATUS_VARIANT,
  DAYCARE_STATUS_LABELS,
  daycareDischargeValidationError,
  formatDaycareDate,
} from "../constants";
import { useDaycareSession, useDischargeDaycareAdmission } from "../hooks";
import { DISCHARGE_TYPE_OPTIONS } from "../../../types/ipd";
import type { DaycareStackParamList } from "./DaycareListScreen";

type Props = NativeStackScreenProps<DaycareStackParamList, "DaycareDetail">;

export function DaycareDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const session = useDaycareSession(sessionId);
  const doctors = useDoctors();
  const dischargeAdmission = useDischargeDaycareAdmission();

  const [dischargeType, setDischargeType] = useState("routine");
  const [summary, setSummary] = useState("");
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [error, setError] = useState<string | null>(null);

  const a = session.data;

  useLayoutEffect(() => {
    if (a) {
      navigation.setOptions({
        title: a.admission_id,
        headerRight: () => (
          <View className="pr-1">
            <Badge label={DAYCARE_STATUS_LABELS[a.status]} variant={ADMISSION_STATUS_VARIANT[a.status]} />
          </View>
        ),
      });
    }
  }, [navigation, a]);

  const doctorName = useMemo(() => {
    if (!a?.doctor_id) return undefined;
    return (doctors.data ?? []).find((d) => d.user_id === a.doctor_id)?.full_name;
  }, [a?.doctor_id, doctors.data]);

  function handleDischarge() {
    if (!a) return;
    const validationError = daycareDischargeValidationError(a.admission_date);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    dischargeAdmission.mutate(
      {
        id: a.id,
        payload: {
          discharge_type: dischargeType,
          discharge_summary: summary.trim() || undefined,
          final_diagnosis: finalDiagnosis.trim() || undefined,
        },
      },
      {
        onSuccess: () => toast.show("Session discharged", "success"),
        onError: (err) =>
          setError(
            err instanceof Error
              ? err.message
              : "Couldn't discharge — daycare sessions must be discharged the same day they were admitted."
          ),
      }
    );
  }

  if (session.isLoading || !a) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
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
      {/* Identity header */}
      <View className="px-4 pt-4">
        <Card padded={false}>
          <View className="flex-row items-center gap-3 p-4">
            <Avatar source={a.patient_name} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {a.patient_name}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {a.patient_id_display} · {a.admission_id}
              </Text>
              <View className="flex-row items-center gap-1.5 pt-1">
                <Badge label={DAYCARE_STATUS_LABELS[a.status]} variant={ADMISSION_STATUS_VARIANT[a.status]} />
                {a.has_mediclaim ? <Badge label="Mediclaim" variant="outline" /> : null}
              </View>
            </View>
          </View>
          <View className="border-t border-border/60 px-1">
            <KeyValueRow label="Ward / bed" value={`${a.ward_name}${a.bed_number ? ` / Bed ${a.bed_number}` : ""}`} />
            <KeyValueRow label="Admitted" value={formatDaycareDate(a.admission_date)} />
            <KeyValueRow label="Discharged" value={formatDaycareDate(a.discharge_date)} />
            {doctorName ? <KeyValueRow label="Attending doctor" value={doctorName} /> : null}
            {a.patient_mobile ? <KeyValueRow label="Mobile" value={a.patient_mobile} /> : null}
          </View>
        </Card>
      </View>

      {/* Reason & diagnosis */}
      <View>
        <SectionHeader title="Reason & diagnosis" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="Reason" value={a.reason || "—"} />
              <KeyValueRow label="Provisional diagnosis" value={a.provisional_diagnosis || "—"} />
              {a.final_diagnosis ? <KeyValueRow label="Final diagnosis" value={a.final_diagnosis} /> : null}
            </View>
          </Card>
        </View>
      </View>

      {/* Billing summary */}
      <View>
        <SectionHeader title="Billing" />
        <View className="px-4">
          <Card padded={false}>
            <View className="px-1">
              <KeyValueRow label="Bill total" value={a.bill_total ?? "—"} />
              <KeyValueRow label="Bill paid" value={a.bill_paid ?? "—"} />
            </View>
          </Card>
        </View>
      </View>

      {/* Same-day discharge action */}
      {a.status === "admitted" ? (
        <View>
          <SectionHeader title="Discharge" />
          <View className="px-4 gap-4">
            <Card>
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                <Text className="flex-1 text-xs text-muted-foreground">
                  Daycare sessions must be discharged the same day they were admitted.
                </Text>
              </View>
            </Card>
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Discharge type</Text>
              <View className="flex-row flex-wrap gap-2">
                {DISCHARGE_TYPE_OPTIONS.map((opt) => {
                  const selected = dischargeType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      accessibilityRole="button"
                      onPress={() => setDischargeType(opt.value)}
                      className={[
                        "h-9 items-center justify-center rounded-full px-3.5",
                        selected ? "bg-primary" : "bg-secondary active:opacity-70",
                      ].join(" ")}
                    >
                      <Text
                        className={[
                          "text-[13px] font-medium",
                          selected ? "text-primary-foreground" : "text-secondary-foreground",
                        ].join(" ")}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Input
              label="Discharge summary (optional)"
              value={summary}
              onChangeText={setSummary}
              multiline
            />
            <Input
              label="Final diagnosis (optional)"
              value={finalDiagnosis}
              onChangeText={setFinalDiagnosis}
              multiline
            />
            <InlineError message={error} />
            <Button title="Discharge session" onPress={handleDischarge} loading={dischargeAdmission.isPending} />
          </View>
        </View>
      ) : (
        <View className="px-4">
          <Card>
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text className="text-sm font-semibold text-foreground">Session discharged</Text>
            </View>
            {a.discharge_type ? (
              <Text className="text-sm text-foreground mt-2">Type: {a.discharge_type}</Text>
            ) : null}
            {a.final_diagnosis ? (
              <Text className="text-sm text-foreground mt-2">Diagnosis: {a.final_diagnosis}</Text>
            ) : null}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}
