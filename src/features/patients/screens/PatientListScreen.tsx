import React, { useState } from "react";
import { FlatList, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EmptyState, Input, ListItem, SkeletonList } from "../../../components/ui";
import type { PatientsStackParamList } from "../../../navigation/PatientsStack";
import { usePatients } from "../hooks";

type Props = NativeStackScreenProps<PatientsStackParamList, "PatientList">;

export function PatientListScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const patients = usePatients(query.trim() ? { search: query.trim() } : undefined);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-1">
        <Input
          placeholder="Search by name, UHID, or mobile…"
          leftIcon="search-outline"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>
      {patients.isLoading ? (
        <SkeletonList />
      ) : (
        <FlatList
          data={patients.data ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ListItem
              title={item.full_name}
              subtitle={`${item.patient_id} · ${item.gender} · ${item.age ?? "—"}y · ${item.mobile_primary}`}
              leftIcon="person-outline"
              onPress={() => navigation.navigate("PatientDetail", { patientId: item.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No patients found"
              message={query ? "Try a different search." : "Search by name, UHID, or mobile number."}
            />
          }
        />
      )}
    </View>
  );
}
