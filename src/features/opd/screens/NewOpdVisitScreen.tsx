import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button, InlineError, Select, useToast } from "../../../components/ui";
import type { OpdStackParamList } from "../../../navigation/OpdStack";
import { PatientPicker } from "../../patients/components/PatientPicker";
import { useDoctors } from "../../../hooks/masters";
import { useCreateVisit } from "../hooks";
import type { PatientListItem } from "../../../types/patients";
import type { VisitType } from "../../../types/opd";

type Props = NativeStackScreenProps<OpdStackParamList, "NewOpdVisit">;

const VISIT_TYPES: Array<{ label: string; value: VisitType }> = [
  { label: "New", value: "new" },
  { label: "Follow-up", value: "follow_up" },
  { label: "Emergency", value: "emergency" },
  { label: "Referral", value: "referral" },
];

export function NewOpdVisitScreen({ navigation }: Props) {
  const toast = useToast();
  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<VisitType>("new");
  const [error, setError] = useState<string | null>(null);

  const doctors = useDoctors();
  const createVisit = useCreateVisit();

  const doctorOptions = (doctors.data ?? []).map((d) => ({ label: d.full_name, value: d.id }));

  function handleSubmit() {
    if (!patient) {
      setError("Select a patient first");
      return;
    }
    setError(null);
    createVisit.mutate(
      {
        patient: patient.id,
        doctor: doctorId ? Number(doctorId) : undefined,
        visit_type: visitType,
      },
      {
        onSuccess: (visit) => {
          toast.show("Visit created", "success");
          navigation.replace("OpdVisitDetail", { visitId: visit.id });
        },
        onError: () => toast.show("Couldn't create the visit", "error"),
      }
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <PatientPicker selected={patient} onSelect={setPatient} />
      <Select
        label="Doctor (optional)"
        placeholder="Any doctor"
        options={doctorOptions}
        value={doctorId}
        onChange={setDoctorId}
        loading={doctors.isLoading}
      />
      <Select label="Visit type" options={VISIT_TYPES} value={visitType} onChange={(v) => setVisitType(v as VisitType)} />
      <InlineError message={error} />
      <View>
        <Button title="Create visit" onPress={handleSubmit} loading={createVisit.isPending} />
      </View>
    </ScrollView>
  );
}
