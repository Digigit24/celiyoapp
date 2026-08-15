/**
 * Read-only patient overview — reuses usePatient() + the Row pattern from
 * PatientDetailScreen.tsx. Deliberately read-only rather than a full
 * editable profile form (web's ProfileTab lets you edit the patient here):
 * this app has consistently kept patient editing web-only outside the New
 * Visit/New Admission inline-creation flow (see CLAUDE.md's scope rules) —
 * porting an editable form here would quietly reopen that boundary.
 */
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Badge, Card } from "../../../../components/ui";
import { usePatient } from "../../../patients/hooks";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <View className="flex-row justify-between py-1.5 border-b border-border">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{String(value)}</Text>
    </View>
  );
}

export function ProfileTab({ patientId }: { patientId: number }) {
  const patient = usePatient(patientId);

  if (patient.isLoading || !patient.data) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const p = patient.data;

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}>
      <Card>
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-foreground">{p.full_name}</Text>
          <Badge label={p.status} variant={p.status === "active" ? "success" : "secondary"} />
        </View>
        <Text className="text-sm text-muted-foreground mt-0.5">
          {p.patient_id} · {p.gender} · {p.age ?? "—"}y
        </Text>
      </Card>

      <Card>
        <Row label="Mobile" value={p.mobile_primary} />
        <Row label="Secondary mobile" value={p.mobile_secondary} />
        <Row label="Email" value={p.email} />
        <Row label="Address" value={p.full_address} />
        <Row label="Blood group" value={p.blood_group} />
        <Row label="Marital status" value={p.marital_status} />
        <Row label="Occupation" value={p.occupation} />
        <Row label="Height" value={p.height ? `${p.height} cm` : null} />
        <Row label="Weight" value={p.weight ? `${p.weight} kg` : null} />
        <Row label="Emergency contact" value={p.emergency_contact_name} />
        <Row label="Emergency phone" value={p.emergency_contact_phone} />
        <Row label="Insurance" value={p.insurance_provider} />
        <Row label="Total visits" value={p.total_visits} />
        <Row label="Last visit" value={p.last_visit_date} />
      </Card>

      {p.allergies.length > 0 ? (
        <View>
          <Text className="text-sm font-semibold text-foreground mb-2">Allergies</Text>
          {p.allergies.map((a) => (
            <Card key={a.id} className="mb-2">
              <Text className="text-sm font-medium text-foreground">{a.allergen}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {a.allergy_type_display} · {a.severity_display}
              </Text>
            </Card>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
