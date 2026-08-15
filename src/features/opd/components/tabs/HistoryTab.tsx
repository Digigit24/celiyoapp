/** Cross-encounter patient timeline — reuses the query pattern from PatientDetailScreen.tsx. */
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { Badge, EmptyState, ListItem } from "../../../../components/ui";
import { listVisits } from "../../../../lib/api/opd";
import { listAdmissions } from "../../../../lib/api/ipd";
import { VISIT_STATUS_VARIANT } from "../../constants";
import { ADMISSION_STATUS_VARIANT } from "../../../ipd/constants";
import type { OpdStackParamList } from "../../../../navigation/OpdStack";

export function HistoryTab({ visitId, patientId }: { visitId: number; patientId: number }) {
  const navigation = useNavigation<NativeStackNavigationProp<OpdStackParamList>>();

  const visits = useQuery({
    queryKey: ["opd", "history", patientId, "visits"],
    queryFn: () => listVisits({ patient: patientId, page_size: 50, ordering: "-visit_date" }),
  });
  const admissions = useQuery({
    queryKey: ["opd", "history", patientId, "admissions"],
    queryFn: () => listAdmissions({ patient: patientId, page_size: 50, ordering: "-admission_date" }),
  });

  if (visits.isLoading || admissions.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  const opdVisits = visits.data?.results ?? [];
  const ipdAdmissions = admissions.data?.results ?? [];

  if (opdVisits.length === 0 && ipdAdmissions.length === 0) {
    return <EmptyState icon="time-outline" title="No history yet" />;
  }

  return (
    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
      <Text className="text-xs font-semibold uppercase text-muted-foreground px-4 pt-4 pb-1">OPD Visits</Text>
      {opdVisits.map((v) => {
        const isCurrent = v.id === visitId;
        return (
          <ListItem
            key={v.id}
            title={v.visit_number}
            subtitle={`${new Date(v.visit_date).toLocaleDateString()} · Dr. ${v.doctor_name ?? "—"}`}
            leftIcon="medkit-outline"
            onPress={isCurrent ? undefined : () => navigation.push("OpdVisitDetail", { visitId: v.id })}
            right={
              <View className="items-end gap-1">
                {isCurrent ? <Badge label="Current" variant="outline" /> : null}
                <Badge label={v.status.replace("_", " ")} variant={VISIT_STATUS_VARIANT[v.status]} />
              </View>
            }
          />
        );
      })}

      <Text className="text-xs font-semibold uppercase text-muted-foreground px-4 pt-4 pb-1">IPD Admissions</Text>
      {ipdAdmissions.length === 0 ? (
        <Text className="text-sm text-muted-foreground px-4 pb-4">No admissions.</Text>
      ) : (
        ipdAdmissions.map((a) => (
          <ListItem
            key={a.id}
            title={a.admission_id}
            subtitle={`${new Date(a.admission_date).toLocaleDateString()} · ${a.ward_name}${a.bed_number ? ` / Bed ${a.bed_number}` : ""}`}
            leftIcon="bed-outline"
            chevron={false}
            right={<Badge label={a.status} variant={ADMISSION_STATUS_VARIANT[a.status]} />}
          />
        ))
      )}
    </ScrollView>
  );
}
