import React, { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, EmptyState, ListItem } from "../../../components/ui";
import type { PatientsStackParamList } from "../../../navigation/PatientsStack";
import { usePatient } from "../hooks";
import { listVisits } from "../../../lib/api/opd";
import { listAdmissions } from "../../../lib/api/ipd";

type Props = NativeStackScreenProps<PatientsStackParamList, "PatientDetail">;

type Tab = "overview" | "visits" | "admissions";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <View className="flex-row justify-between py-1.5 border-b border-border">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{String(value)}</Text>
    </View>
  );
}

export function PatientDetailScreen({ route }: Props) {
  const { patientId } = route.params;
  const [tab, setTab] = useState<Tab>("overview");
  const patient = usePatient(patientId);

  const visits = useQuery({
    queryKey: ["patients", patientId, "visits"],
    queryFn: () => listVisits({ patient: patientId, page_size: 50 }),
    enabled: tab === "visits",
  });
  const admissions = useQuery({
    queryKey: ["patients", patientId, "admissions"],
    queryFn: () => listAdmissions({ patient: patientId, page_size: 50 }),
    enabled: tab === "admissions",
  });

  if (patient.isLoading || !patient.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    );
  }

  const p = patient.data;
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "visits", label: "OPD Visits" },
    { key: "admissions", label: "IPD Admissions" },
  ];

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-3">
        <Card>
          <Text className="text-lg font-semibold text-foreground">{p.full_name}</Text>
          <Text className="text-sm text-muted-foreground mt-0.5">
            {p.patient_id} · {p.gender} · {p.age ?? "—"}y
          </Text>
          <View className="flex-row gap-2 mt-2">
            <Badge label={p.status} variant={p.status === "active" ? "success" : "secondary"} />
            {p.blood_group ? <Badge label={p.blood_group} variant="outline" /> : null}
          </View>
        </Card>
      </View>

      <View className="flex-row gap-2 px-4 py-3">
        {tabs.map((t) => (
          <Text
            key={t.key}
            onPress={() => setTab(t.key)}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium overflow-hidden",
              tab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            ].join(" ")}
          >
            {t.label}
          </Text>
        ))}
      </View>

      {tab === "overview" ? (
        <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
          <Card>
            <Row label="Mobile" value={p.mobile_primary} />
            <Row label="Secondary mobile" value={p.mobile_secondary} />
            <Row label="Email" value={p.email} />
            <Row label="Address" value={p.full_address} />
            <Row label="Marital status" value={p.marital_status} />
            <Row label="Occupation" value={p.occupation} />
            <Row label="Height" value={p.height ? `${p.height} cm` : null} />
            <Row label="Weight" value={p.weight ? `${p.weight} kg` : null} />
            <Row label="BMI" value={p.bmi} />
            <Row label="Emergency contact" value={p.emergency_contact_name} />
            <Row label="Emergency phone" value={p.emergency_contact_phone} />
            <Row label="Insurance" value={p.insurance_provider} />
            <Row label="Total visits" value={p.total_visits} />
            <Row label="Last visit" value={p.last_visit_date} />
          </Card>

          {p.allergies.length > 0 ? (
            <View className="mt-3">
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
      ) : null}

      {tab === "visits" ? (
        visits.isLoading ? (
          <ActivityIndicator className="mt-6" />
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
            {(visits.data?.results.length ?? 0) === 0 ? (
              <EmptyState icon="medkit-outline" title="No OPD visits" />
            ) : (
              visits.data!.results.map((v) => (
                <ListItem
                  key={v.id}
                  title={v.visit_number}
                  subtitle={`${v.visit_date} · ${v.status} · Dr. ${v.doctor_name ?? "—"}`}
                  leftIcon="medkit-outline"
                />
              ))
            )}
          </ScrollView>
        )
      ) : null}

      {tab === "admissions" ? (
        admissions.isLoading ? (
          <ActivityIndicator className="mt-6" />
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
            {(admissions.data?.results.length ?? 0) === 0 ? (
              <EmptyState icon="bed-outline" title="No IPD admissions" />
            ) : (
              admissions.data!.results.map((a) => (
                <ListItem
                  key={a.id}
                  title={a.admission_id}
                  subtitle={`${a.admission_date} · ${a.status} · ${a.ward_name}`}
                  leftIcon="bed-outline"
                />
              ))
            )}
          </ScrollView>
        )
      ) : null}
    </View>
  );
}
