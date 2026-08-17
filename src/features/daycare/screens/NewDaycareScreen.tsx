import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, InlineError, Input, Select, useToast } from "../../../components/ui";
import { PatientPicker } from "../../patients/components/PatientPicker";
import { useDoctors, useWards, useBeds } from "../../../hooks/masters";
import { useCreateDaycareAdmission } from "../hooks";
import type { PatientListItem } from "../../../types/patients";
import type { ClaimStatus } from "../../../types/ipd";
import { TPA_OPTIONS } from "../../../types/ipd";
import type { DaycareStackParamList } from "./DaycareListScreen";

type Props = NativeStackScreenProps<DaycareStackParamList, "NewDaycareSession">;

const CLAIM_STATUSES: Array<{ label: string; value: ClaimStatus }> = [
  { label: "Not started", value: "not_started" },
  { label: "Documents pending", value: "documents_pending" },
  { label: "Submitted", value: "submitted" },
  { label: "Under review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Settled", value: "settled" },
];

/**
 * Create form for a daycare admission — closely mirrors
 * `NewIpdAdmissionScreen`, but `admission_type` is preset to `"daycare"` and
 * hidden from the picker (there's no separate daycare create endpoint; this
 * still posts to `/ipd/admissions` then patches the registration's
 * `admission_type`, same two-step create flow IPD uses for non-regular types).
 */
export function NewDaycareScreen({ navigation }: Props) {
  const toast = useToast();
  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [wardId, setWardId] = useState<string | null>(null);
  const [bedId, setBedId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [hasMediclaim, setHasMediclaim] = useState(false);
  const [tpaName, setTpaName] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>("not_started");
  const [claimReference, setClaimReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wards = useWards();
  const beds = useBeds(wardId ?? undefined);
  const doctors = useDoctors();
  const createDaycareAdmission = useCreateDaycareAdmission();

  const wardOptions = (wards.data ?? []).map((w) => ({
    label: `${w.name} (${w.available_beds_count} free)`,
    value: w.id,
  }));
  const bedOptions = (beds.data ?? [])
    .filter((b) => !b.is_occupied)
    .map((b) => ({ label: `Bed ${b.bed_number}`, value: b.id }));
  const doctorOptions = (doctors.data ?? []).map((d) => ({ label: d.full_name, value: d.user_id }));
  const tpaOptions = TPA_OPTIONS.map((t) => ({ label: t, value: t }));

  async function handleSubmit() {
    if (!patient) return setError("Select a patient first");
    if (!wardId) return setError("Select a ward");
    if (!reason.trim()) return setError("Reason for the visit is required");
    setError(null);

    try {
      const admission = await createDaycareAdmission.mutateAsync({
        patient: patient.id,
        ward: wardId,
        bed: bedId,
        doctor_id: doctorId,
        reason: reason.trim(),
        provisional_diagnosis: diagnosis.trim() || undefined,
        has_mediclaim: hasMediclaim,
        tpa_name: hasMediclaim ? tpaName ?? undefined : undefined,
        claim_status: hasMediclaim ? claimStatus : undefined,
        claim_reference_number: hasMediclaim ? claimReference.trim() || undefined : undefined,
      });
      toast.show("Daycare session started", "success");
      navigation.replace("DaycareDetail", { sessionId: admission.id });
    } catch {
      toast.show("Couldn't start the daycare session", "error");
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View className="flex-row items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
        <Ionicons name="information-circle-outline" size={16} color="#0f172a" />
        <Text className="flex-1 text-xs text-foreground">
          Daycare sessions must be discharged the same day they're admitted.
        </Text>
      </View>

      <PatientPicker selected={patient} onSelect={setPatient} />

      <Select
        label="Ward"
        placeholder="Select ward"
        options={wardOptions}
        value={wardId}
        onChange={(v) => {
          setWardId(v);
          setBedId(null);
        }}
        loading={wards.isLoading}
      />
      <Select
        label="Bed / chair (optional)"
        placeholder={wardId ? "Select bed" : "Select a ward first"}
        options={bedOptions}
        value={bedId}
        onChange={setBedId}
        loading={beds.isLoading}
        disabled={!wardId}
      />
      <Select
        label="Attending doctor"
        placeholder="Select doctor"
        options={doctorOptions}
        value={doctorId}
        onChange={setDoctorId}
        loading={doctors.isLoading}
      />
      <Input label="Reason for visit" value={reason} onChangeText={setReason} multiline />
      <Input label="Provisional diagnosis" value={diagnosis} onChangeText={setDiagnosis} multiline />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: hasMediclaim }}
        onPress={() => setHasMediclaim((v) => !v)}
        className="flex-row items-center gap-2.5"
      >
        <View
          className={[
            "h-5 w-5 items-center justify-center rounded border",
            hasMediclaim ? "bg-primary border-primary" : "bg-card border-input",
          ].join(" ")}
        >
          {hasMediclaim ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
        </View>
        <Text className="text-sm text-foreground">Has mediclaim / insurance</Text>
      </Pressable>

      {hasMediclaim ? (
        <View className="gap-4">
          <Select label="TPA / Insurer" placeholder="Select TPA" options={tpaOptions} value={tpaName} onChange={setTpaName} />
          <Select
            label="Claim status"
            options={CLAIM_STATUSES}
            value={claimStatus}
            onChange={(v) => setClaimStatus(v as ClaimStatus)}
          />
          <Input label="Claim / pre-auth number" value={claimReference} onChangeText={setClaimReference} />
        </View>
      ) : null}

      <InlineError message={error} />
      <View>
        <Button title="Start daycare session" onPress={handleSubmit} loading={createDaycareAdmission.isPending} />
      </View>
    </ScrollView>
  );
}
