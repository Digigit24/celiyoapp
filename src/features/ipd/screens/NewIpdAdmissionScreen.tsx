import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, InlineError, Input, Select, useToast } from "../../../components/ui";
import type { IpdStackParamList } from "../../../navigation/IpdStack";
import { PatientPicker } from "../../patients/components/PatientPicker";
import { useDoctors, useWards, useBeds } from "../../../hooks/masters";
import { useCreateAdmission, useUpdateRegistration } from "../hooks";
import type { PatientListItem } from "../../../types/patients";
import type { AdmissionType, ClaimStatus } from "../../../types/ipd";
import { TPA_OPTIONS } from "../../../types/ipd";

type Props = NativeStackScreenProps<IpdStackParamList, "NewIpdAdmission">;

const ADMISSION_TYPES: Array<{ label: string; value: AdmissionType }> = [
  { label: "Regular", value: "regular" },
  { label: "Emergency", value: "emergency" },
  { label: "Transfer", value: "transfer" },
  { label: "Readmission", value: "readmission" },
];

const CLAIM_STATUSES: Array<{ label: string; value: ClaimStatus }> = [
  { label: "Not started", value: "not_started" },
  { label: "Documents pending", value: "documents_pending" },
  { label: "Submitted", value: "submitted" },
  { label: "Under review", value: "under_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Settled", value: "settled" },
];

export function NewIpdAdmissionScreen({ navigation }: Props) {
  const toast = useToast();
  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [wardId, setWardId] = useState<string | null>(null);
  const [bedId, setBedId] = useState<string | null>(null);
  const [admissionType, setAdmissionType] = useState<AdmissionType>("regular");
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
  const createAdmission = useCreateAdmission();
  const updateRegistration = useUpdateRegistration();

  const wardOptions = (wards.data ?? []).map((w) => ({ label: `${w.name} (${w.available_beds_count} free)`, value: w.id }));
  const bedOptions = (beds.data ?? [])
    .filter((b) => !b.is_occupied)
    .map((b) => ({ label: `Bed ${b.bed_number}`, value: b.id }));
  const doctorOptions = (doctors.data ?? []).map((d) => ({ label: d.full_name, value: d.user_id }));
  const tpaOptions = TPA_OPTIONS.map((t) => ({ label: t, value: t }));

  function handleSubmit() {
    if (!patient) return setError("Select a patient first");
    if (!wardId) return setError("Select a ward");
    if (!reason.trim()) return setError("Reason for admission is required");
    setError(null);

    createAdmission.mutate(
      {
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
      },
      {
        onSuccess: (admission) => {
          // Soft-fail on the second call, matching web — the admission itself already succeeded.
          updateRegistration.mutate(
            { id: admission.id, payload: { admission_type: admissionType } },
            { onError: () => toast.show("Admission created — edit type from Registration", "info") }
          );
          toast.show("Patient admitted", "success");
          navigation.replace("IpdAdmissionDetail", { admissionId: admission.id });
        },
        onError: () => toast.show("Couldn't create the admission", "error"),
      }
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 16 }}>
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
        label="Bed (optional)"
        placeholder={wardId ? "Select bed" : "Select a ward first"}
        options={bedOptions}
        value={bedId}
        onChange={setBedId}
        loading={beds.isLoading}
        disabled={!wardId}
      />
      <Select label="Admission type" options={ADMISSION_TYPES} value={admissionType} onChange={(v) => setAdmissionType(v as AdmissionType)} />
      <Select label="Attending doctor" placeholder="Select doctor" options={doctorOptions} value={doctorId} onChange={setDoctorId} loading={doctors.isLoading} />
      <Input label="Reason for admission" value={reason} onChangeText={setReason} multiline />
      <Input label="Provisional diagnosis" value={diagnosis} onChangeText={setDiagnosis} multiline />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: hasMediclaim }}
        onPress={() => setHasMediclaim((v) => !v)}
        className="flex-row items-center gap-2.5"
      >
        <View className={["h-5 w-5 items-center justify-center rounded border", hasMediclaim ? "bg-primary border-primary" : "bg-card border-input"].join(" ")}>
          {hasMediclaim ? <Ionicons name="checkmark" size={14} color="#ffffff" /> : null}
        </View>
        <Text className="text-sm text-foreground">Has mediclaim / insurance</Text>
      </Pressable>

      {hasMediclaim ? (
        <View className="gap-4">
          <Select label="TPA / Insurer" placeholder="Select TPA" options={tpaOptions} value={tpaName} onChange={setTpaName} />
          <Select label="Claim status" options={CLAIM_STATUSES} value={claimStatus} onChange={(v) => setClaimStatus(v as ClaimStatus)} />
          <Input label="Claim / pre-auth number" value={claimReference} onChangeText={setClaimReference} />
        </View>
      ) : null}

      <InlineError message={error} />
      <View>
        <Button title="Admit patient" onPress={handleSubmit} loading={createAdmission.isPending} />
      </View>
    </ScrollView>
  );
}
