import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, useToast } from "../../../../components/ui";
import { useDischargeAdmission } from "../../hooks";
import type { PrintPreviewNavigation } from "../../../clinical/screens/PrintPreviewScreen";
import { DISCHARGE_TYPE_OPTIONS } from "../../../../types/ipd";
import type { AdmissionDetail } from "../../../../types/ipd";
import { DischargePacketPanel } from "../DischargePacketPanel";

export function DischargeTab({ admission }: { admission: AdmissionDetail }) {
  const toast = useToast();
  const navigation = useNavigation() as unknown as PrintPreviewNavigation;
  const dischargeAdmission = useDischargeAdmission();
  const [dischargeType, setDischargeType] = useState("routine");
  const [summary, setSummary] = useState("");
  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const admitted = admission.status === "admitted";

  function handlePrintAdmissionForm() {
    navigation.navigate("PrintPreview", {
      formCode: "admission_form",
      recordId: admission.id,
      title: admission.admission_id,
    });
  }

  function handleSubmit() {
    if (!confirmed) {
      toast.show("Please confirm that you want to discharge this patient.", "error");
      return;
    }
    dischargeAdmission.mutate(
      {
        id: admission.id,
        payload: {
          discharge_type: dischargeType,
          discharge_summary: summary.trim() || undefined,
          final_diagnosis: finalDiagnosis.trim() || undefined,
        },
      },
      {
        onSuccess: () => toast.show("Patient discharged", "success"),
        onError: () => toast.show("Couldn't discharge the patient", "error"),
      }
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
      <DischargePacketPanel admissionId={admission.id} />

      <View>
        <Button title="Print Admission / Discharge Form" variant="outline" onPress={handlePrintAdmissionForm} />
      </View>

      {!admitted ? (
        <Card>
          <View className="flex-row items-center gap-2">
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text className="text-sm font-semibold text-foreground">Patient discharged</Text>
          </View>
          {admission.discharge_date ? (
            <Text className="text-sm text-muted-foreground mt-2">
              {new Date(admission.discharge_date).toLocaleString()}
            </Text>
          ) : null}
          {admission.discharge_type ? (
            <Text className="text-sm text-foreground mt-2">Type: {admission.discharge_type}</Text>
          ) : null}
          {admission.final_diagnosis ? (
            <Text className="text-sm text-foreground mt-2">Diagnosis: {admission.final_diagnosis}</Text>
          ) : null}
          {admission.discharge_summary ? (
            <Text className="text-sm text-foreground mt-2">{admission.discharge_summary}</Text>
          ) : null}
        </Card>
      ) : (
        <Card>
          <Text className="text-sm font-semibold text-foreground mb-2">Discharge patient</Text>
          <View className="gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Discharge type</Text>
              <View className="flex-row flex-wrap gap-2">
                {DISCHARGE_TYPE_OPTIONS.map((opt) => {
                  const selected = dischargeType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setDischargeType(opt.value)}
                      className={["px-3.5 py-2 rounded-full border", selected ? "bg-primary border-primary" : "bg-card border-input"].join(" ")}
                    >
                      <Text className={["text-sm font-medium", selected ? "text-primary-foreground" : "text-foreground"].join(" ")}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Input label="Final diagnosis" value={finalDiagnosis} onChangeText={setFinalDiagnosis} multiline />
            <Input label="Discharge summary" value={summary} onChangeText={setSummary} multiline />

            <Pressable onPress={() => setConfirmed((v) => !v)} className="flex-row items-start gap-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3">
              <View className={["h-5 w-5 mt-0.5 rounded border items-center justify-center", confirmed ? "bg-primary border-primary" : "border-input"].join(" ")}>
                {confirmed ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
              </View>
              <Text className="flex-1 text-xs text-amber-800 dark:text-amber-200">
                I confirm this patient is being discharged and this action cannot be undone.
              </Text>
            </Pressable>

            <Button
              title="Discharge patient"
              variant="destructive"
              onPress={handleSubmit}
              loading={dischargeAdmission.isPending}
            />
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
