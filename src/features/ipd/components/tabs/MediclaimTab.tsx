import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Card, Input, Select, useToast } from "../../../../components/ui";
import { useUpdateAdmission } from "../../hooks";
import { CLAIM_STATUS_LABELS, CLAIM_STATUS_STEPS } from "../../constants";
import { TPA_OPTIONS } from "../../../../types/ipd";
import type { AdmissionDetail, ClaimStatus } from "../../../../types/ipd";

function ClaimStatusStepper({ status }: { status: ClaimStatus }) {
  if (status === "rejected") {
    return (
      <View className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5">
        <Text className="text-sm font-medium text-destructive">Claim rejected</Text>
      </View>
    );
  }
  const activeIndex = CLAIM_STATUS_STEPS.indexOf(status);
  return (
    <View className="flex-row items-center">
      {CLAIM_STATUS_STEPS.map((step, i) => {
        const done = i <= activeIndex;
        return (
          <React.Fragment key={step}>
            <View
              className={["h-6 w-6 rounded-full items-center justify-center", done ? "bg-primary" : "bg-muted"].join(" ")}
            >
              {done ? (
                <Ionicons name="checkmark" size={13} color="#ffffff" />
              ) : (
                <Text className="text-[10px] text-muted-foreground">{i + 1}</Text>
              )}
            </View>
            {i < CLAIM_STATUS_STEPS.length - 1 ? (
              <View className={["flex-1 h-0.5", i < activeIndex ? "bg-primary" : "bg-muted"].join(" ")} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function MediclaimTab({ admission }: { admission: AdmissionDetail }) {
  const toast = useToast();
  const updateAdmission = useUpdateAdmission();
  const [tpaName, setTpaName] = useState<string | null>(admission.tpa_name);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>(admission.claim_status);
  const [claimReference, setClaimReference] = useState(admission.claim_reference_number ?? "");
  const [claimNotes, setClaimNotes] = useState(admission.claim_notes ?? "");

  useEffect(() => {
    setTpaName(admission.tpa_name);
    setClaimStatus(admission.claim_status);
    setClaimReference(admission.claim_reference_number ?? "");
    setClaimNotes(admission.claim_notes ?? "");
  }, [admission.id, admission.tpa_name, admission.claim_status, admission.claim_reference_number, admission.claim_notes]);

  const tpaOptions = TPA_OPTIONS.map((t) => ({ label: t, value: t }));
  const claimStatusOptions = Object.entries(CLAIM_STATUS_LABELS)
    .filter(([value]) => value !== "not_applicable")
    .map(([value, label]) => ({ label, value }));

  function handleSave() {
    updateAdmission.mutate(
      {
        id: admission.id,
        payload: {
          has_mediclaim: true,
          tpa_name: tpaName ?? undefined,
          claim_status: claimStatus,
          claim_reference_number: claimReference.trim() || undefined,
          claim_notes: claimNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => toast.show("Claim details saved", "success"),
        onError: () => toast.show("Couldn't save claim details", "error"),
      }
    );
  }

  function handleCancelMediclaim() {
    Alert.alert(
      "Cancel mediclaim?",
      "The Mediclaim tab will be hidden and billing will treat the patient as self-pay. Claim details are kept and restored if mediclaim is re-enabled.",
      [
        { text: "Keep mediclaim", style: "cancel" },
        {
          text: "Cancel mediclaim",
          style: "destructive",
          onPress: () =>
            updateAdmission.mutate(
              { id: admission.id, payload: { has_mediclaim: false } },
              {
                onSuccess: () => toast.show("Mediclaim cancelled", "success"),
                onError: () => toast.show("Couldn't cancel mediclaim", "error"),
              }
            ),
        },
      ]
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
      <Card>
        <Text className="text-base font-semibold text-foreground">{admission.patient_name}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {admission.admission_id} · {admission.ward_name}
        </Text>
        <View className="flex-row gap-2 mt-2">
          <Badge label={tpaName || "TPA not set"} variant="outline" />
          <Badge label={CLAIM_STATUS_LABELS[claimStatus]} variant="secondary" />
        </View>
        <View className="mt-4">
          <ClaimStatusStepper status={claimStatus} />
        </View>
      </Card>

      <Card>
        <View className="gap-4">
          <Select label="TPA / Insurer" placeholder="Select TPA" options={tpaOptions} value={tpaName} onChange={setTpaName} />
          <Select
            label="Claim status"
            options={claimStatusOptions}
            value={claimStatus}
            onChange={(v) => setClaimStatus(v as ClaimStatus)}
          />
          <Input label="Claim / pre-auth reference number" value={claimReference} onChangeText={setClaimReference} />
          <Input label="Claim notes" value={claimNotes} onChangeText={setClaimNotes} multiline />
        </View>
        <View className="mt-4">
          <Button title="Save Claim Details" onPress={handleSave} loading={updateAdmission.isPending} />
        </View>
      </Card>

      <Button title="Cancel Mediclaim" variant="destructive" onPress={handleCancelMediclaim} />
    </ScrollView>
  );
}
