/** Latest recorded finding + a form to record a new one — VisitFinding, distinct from the New Visit form's discarded vitals fields. */
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Button, Card, Input, useToast } from "../../../../components/ui";
import { useCreateVisitFinding, useVisitFindings } from "../../hooks";

function VitalRow({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <View className="flex-1 min-w-[100px] gap-0.5">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-base font-semibold text-foreground">
        {value === null || value === undefined || value === "" ? "—" : `${value}${unit ?? ""}`}
      </Text>
    </View>
  );
}

export function VitalsTab({ visitId }: { visitId: number }) {
  const toast = useToast();
  const findings = useVisitFindings(visitId);
  const createFinding = useCreateVisitFinding(visitId);
  const [recording, setRecording] = useState(false);
  const [form, setForm] = useState({
    temperature: "",
    pulse: "",
    bp_systolic: "",
    bp_diastolic: "",
    spo2: "",
    weight: "",
  });

  const latest = findings.data?.[0] ?? null;

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    createFinding.mutate(
      {
        temperature: form.temperature ? Number(form.temperature) : undefined,
        pulse: form.pulse ? Number(form.pulse) : undefined,
        bp_systolic: form.bp_systolic ? Number(form.bp_systolic) : undefined,
        bp_diastolic: form.bp_diastolic ? Number(form.bp_diastolic) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      },
      {
        onSuccess: () => {
          toast.show("Vitals recorded", "success");
          setRecording(false);
          setForm({ temperature: "", pulse: "", bp_systolic: "", bp_diastolic: "", spo2: "", weight: "" });
        },
        onError: () => toast.show("Couldn't record vitals", "error"),
      }
    );
  }

  if (findings.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
      <Card>
        <Text className="text-sm font-semibold text-foreground mb-3">Latest vitals</Text>
        {latest ? (
          <>
            <View className="flex-row flex-wrap gap-4">
              <VitalRow label="Temp" value={latest.temperature} unit="°C" />
              <VitalRow label="Pulse" value={latest.pulse} unit=" bpm" />
              <VitalRow label="BP" value={latest.blood_pressure} />
              <VitalRow label="SpO2" value={latest.spo2} unit="%" />
              <VitalRow label="Weight" value={latest.weight} unit=" kg" />
              <VitalRow label="BMI" value={latest.bmi} />
            </View>
            <Text className="text-xs text-muted-foreground mt-3">
              Recorded {new Date(latest.finding_date).toLocaleString()}
            </Text>
          </>
        ) : (
          <Text className="text-sm text-muted-foreground">No vitals recorded yet.</Text>
        )}
      </Card>

      {recording ? (
        <Card>
          <Text className="text-sm font-semibold text-foreground mb-3">Record vitals</Text>
          <View className="gap-4">
            <Input label="Temperature (°C)" value={form.temperature} onChangeText={(v) => set("temperature", v)} keyboardType="numeric" />
            <Input label="Pulse (bpm)" value={form.pulse} onChangeText={(v) => set("pulse", v)} keyboardType="numeric" />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input label="BP Systolic" value={form.bp_systolic} onChangeText={(v) => set("bp_systolic", v)} keyboardType="numeric" />
              </View>
              <View className="flex-1">
                <Input label="BP Diastolic" value={form.bp_diastolic} onChangeText={(v) => set("bp_diastolic", v)} keyboardType="numeric" />
              </View>
            </View>
            <Input label="SpO2 (%)" value={form.spo2} onChangeText={(v) => set("spo2", v)} keyboardType="numeric" />
            <Input label="Weight (kg)" value={form.weight} onChangeText={(v) => set("weight", v)} keyboardType="numeric" />
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button title="Cancel" variant="outline" onPress={() => setRecording(false)} />
              </View>
              <View className="flex-1">
                <Button title="Save" onPress={handleSubmit} loading={createFinding.isPending} />
              </View>
            </View>
          </View>
        </Card>
      ) : (
        <Button title="Record Vitals" onPress={() => setRecording(true)} />
      )}
    </ScrollView>
  );
}
