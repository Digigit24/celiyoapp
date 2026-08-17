/**
 * New Lab Order — patient + encounter + multi-test picker, one
 * `POST /diagnostics/requisitions` call creates the requisition and every
 * child DiagnosticOrder row in one shot (status `pending`, price auto-filled
 * server-side from each investigation's base_charge).
 */
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Chip, Input, InlineError, Select, useToast } from "../../../components/ui";
import { PatientPicker } from "../../patients/components/PatientPicker";
import { listVisits } from "../../../lib/api/opd";
import { listAdmissions } from "../../../lib/api/ipd";
import { useAuth } from "../../../store/AuthContext";
import { PRIORITY_LABELS } from "../constants";
import { useCreateRequisition, useInvestigationSearch } from "../hooks";
import type { InvestigationOption } from "../../../lib/api/diagnostics";
import type { PatientListItem } from "../../../types/patients";
import type { DiagnosticsEncounterType, RequisitionPriority } from "../../../types/diagnostics";
import type { LabStackParamList } from "./LabListScreen";

type Props = NativeStackScreenProps<LabStackParamList, "NewLabOrder">;

const ENCOUNTER_TYPE_OPTIONS: Array<{ label: string; value: DiagnosticsEncounterType }> = [
  { label: "OPD Visit", value: "opd.visit" },
  { label: "IPD Admission", value: "ipd.admission" },
];

const PRIORITY_OPTIONS: Array<{ label: string; value: RequisitionPriority }> = (
  Object.keys(PRIORITY_LABELS) as RequisitionPriority[]
).map((p) => ({ label: PRIORITY_LABELS[p], value: p }));

export function NewLabOrderScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session } = useAuth();

  const [patient, setPatient] = useState<PatientListItem | null>(null);
  const [encounterType, setEncounterType] = useState<DiagnosticsEncounterType | null>(null);
  const [encounterIdStr, setEncounterIdStr] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState<InvestigationOption[]>([]);
  const [priority, setPriority] = useState<RequisitionPriority>("routine");
  const [doctorId, setDoctorId] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const visitsQuery = useQuery({
    queryKey: ["diagnostics", "new-order", "visits", patient?.id],
    queryFn: () => listVisits({ patient: patient!.id, page_size: 20 }),
    enabled: Boolean(patient) && encounterType === "opd.visit",
  });
  const admissionsQuery = useQuery({
    queryKey: ["diagnostics", "new-order", "admissions", patient?.id],
    queryFn: () => listAdmissions({ patient: patient!.id, page_size: 20 }),
    enabled: Boolean(patient) && encounterType === "ipd.admission",
  });

  const encounterOptions =
    encounterType === "opd.visit"
      ? (visitsQuery.data?.results ?? []).map((v) => ({
          label: `${v.visit_number} · ${v.visit_date}`,
          value: String(v.id),
        }))
      : encounterType === "ipd.admission"
        ? (admissionsQuery.data?.results ?? []).map((a) => ({
            label: `${a.admission_id} · ${a.admission_date}`,
            value: String(a.id),
          }))
        : [];
  const encounterLoading = encounterType === "opd.visit" ? visitsQuery.isLoading : admissionsQuery.isLoading;

  const testSearch = useInvestigationSearch(testQuery);
  const testResults = (testSearch.data ?? []).filter(
    (opt) => !selectedTests.some((t) => t.id === opt.id)
  );
  const totalPrice = selectedTests.reduce((sum, t) => sum + (Number.parseFloat(t.base_charge) || 0), 0);

  const createRequisition = useCreateRequisition();

  function toggleTest(opt: InvestigationOption) {
    setSelectedTests((prev) => [...prev, opt]);
    setTestQuery("");
  }

  function removeTest(id: number) {
    setSelectedTests((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSelectPatient(next: PatientListItem | null) {
    setPatient(next);
    setEncounterType(null);
    setEncounterIdStr(null);
  }

  function handleSubmit() {
    if (!patient) return setError("Select a patient");
    if (!encounterType) return setError("Select an encounter type");
    if (!encounterIdStr) return setError("Select the encounter");
    if (selectedTests.length === 0) return setError("Select at least one test");
    setError(null);

    createRequisition.mutate(
      {
        requisition_type: "investigation",
        patient: patient.id,
        requesting_doctor_id: doctorId.trim() || undefined,
        priority,
        clinical_notes: clinicalNotes.trim() || undefined,
        encounter_type: encounterType,
        encounter_id: Number(encounterIdStr),
        investigation_ids: selectedTests.map((t) => t.id),
      },
      {
        onSuccess: (requisition) => {
          toast.show(`Lab order created — ${selectedTests.length} test${selectedTests.length === 1 ? "" : "s"}`, "success");
          const firstOrder = requisition.investigation_orders[0];
          if (firstOrder) {
            navigation.replace("LabDetail", { orderId: firstOrder.id });
          } else {
            navigation.goBack();
          }
        },
        onError: () => toast.show("Couldn't create the lab order", "error"),
      }
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Patient</Text>
          <PatientPicker selected={patient} onSelect={handleSelectPatient} />
        </View>

        {patient ? (
          <View className="gap-3">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Encounter</Text>
            <Select
              label="Encounter type"
              options={ENCOUNTER_TYPE_OPTIONS}
              value={encounterType}
              onChange={(v) => {
                setEncounterType(v as DiagnosticsEncounterType);
                setEncounterIdStr(null);
              }}
            />
            {encounterType ? (
              <Select
                label={encounterType === "opd.visit" ? "Visit" : "Admission"}
                placeholder={encounterLoading ? "Loading…" : "Select…"}
                options={encounterOptions}
                value={encounterIdStr}
                onChange={setEncounterIdStr}
                loading={encounterLoading}
              />
            ) : null}
            {encounterType && !encounterLoading && encounterOptions.length === 0 ? (
              <Text className="text-xs text-muted-foreground">
                No {encounterType === "opd.visit" ? "OPD visits" : "IPD admissions"} found for this patient.
              </Text>
            ) : null}
          </View>
        ) : null}

        <View className="gap-2">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tests</Text>
          <Input
            label="Search investigations"
            placeholder="e.g. CBC, Lipid Profile…"
            leftIcon="search-outline"
            value={testQuery}
            onChangeText={setTestQuery}
            autoCapitalize="none"
          />
          {testQuery.trim().length >= 2 && testResults.length > 0 ? (
            <View className="rounded-lg border border-border bg-card overflow-hidden">
              {testResults.map((opt) => (
                <Pressable
                  key={opt.id}
                  accessibilityRole="button"
                  onPress={() => toggleTest(opt)}
                  className="flex-row items-center justify-between px-3 py-2.5 border-b border-border active:bg-accent"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {opt.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                      {opt.code} · {opt.category} · ₹{opt.base_charge}
                    </Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
                </Pressable>
              ))}
            </View>
          ) : null}

          {selectedTests.length > 0 ? (
            <Card>
              <View className="flex-row flex-wrap gap-2">
                {selectedTests.map((t) => (
                  <Chip key={t.id} label={t.name} onRemove={() => removeTest(t.id)} />
                ))}
              </View>
              <View className="mt-3 flex-row items-center justify-between border-t border-border/60 pt-3">
                <Text className="text-sm font-medium text-muted-foreground">
                  {selectedTests.length} test{selectedTests.length === 1 ? "" : "s"}
                </Text>
                <Text className="text-sm font-semibold text-foreground">₹{totalPrice.toFixed(2)}</Text>
              </View>
            </Card>
          ) : null}
        </View>

        <View className="gap-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Details</Text>
          <Select label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={(v) => setPriority(v as RequisitionPriority)} />
          <Input
            label="Requesting doctor id"
            placeholder="Optional — doctor's user id"
            value={doctorId}
            onChangeText={setDoctorId}
            autoCapitalize="none"
          />
          <Text className="-mt-2 text-xs text-muted-foreground">
            Optional. No doctor directory is available here, so this is the raw user id if known.
          </Text>
          <Input label="Clinical notes" placeholder="Optional" value={clinicalNotes} onChangeText={setClinicalNotes} multiline />
        </View>

        <InlineError message={error} />
      </ScrollView>

      <View
        className="border-t border-border bg-card px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          title={session ? "Create lab order" : "Sign in required"}
          onPress={handleSubmit}
          loading={createRequisition.isPending}
          disabled={!session}
        />
      </View>
    </View>
  );
}
